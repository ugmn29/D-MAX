'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getQuestionnaires, type Questionnaire, type QuestionnaireQuestion } from '@/lib/api/questionnaires'
import { Edit, Save, X, Plus, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react'

interface QuestionnaireEditModalProps {
  isOpen: boolean
  onClose: () => void
  questionnaireId: string
  clinicId: string
  onSave?: (questionnaire: Questionnaire) => void
}

interface FormData {
  [key: string]: string | string[] | number | boolean
}

export function QuestionnaireEditModal({ 
  isOpen, 
  onClose, 
  questionnaireId, 
  clinicId, 
  onSave 
}: QuestionnaireEditModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([])
  const [formData, setFormData] = useState<FormData>({})
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [currentSection, setCurrentSection] = useState<string>('患者情報')
  const [editingMode, setEditingMode] = useState<'view' | 'edit'>('view')
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [editData, setEditData] = useState<{
    question_text: string
    question_type: string
    options: string[]
    is_required: boolean
    section_name: string
    sort_order: number
    linked_field?: string
  }>({
    question_text: '',
    question_type: 'text',
    options: [],
    is_required: false,
    section_name: '',
    sort_order: 0,
    linked_field: ''
  })


  // データ読み込み
  useEffect(() => {
    if (!isOpen || !questionnaireId) return

    const loadQuestionnaire = async () => {
      try {
        setLoading(true)
        const questionnaires = await getQuestionnaires(clinicId)
        const targetQuestionnaire = questionnaires.find(q => q.id === questionnaireId)
        
        if (targetQuestionnaire) {
          setQuestionnaire(targetQuestionnaire)
          setQuestions(targetQuestionnaire.questions)

          // 最初のセクションを設定
          const firstSection = Array.from(new Set(targetQuestionnaire.questions.map(q => q.section_name).filter(Boolean)))[0]
          if (firstSection) {
            setCurrentSection(firstSection)
          }

          // フォームデータの初期化
          const initialData: FormData = {}
          targetQuestionnaire.questions.forEach(q => {
            if (q.question_type === 'checkbox') {
              initialData[q.id] = []
            } else {
              initialData[q.id] = ''
            }
          })
          setFormData(initialData)
        }
      } catch (error) {
        console.error('問診票読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQuestionnaire()
  }, [isOpen, questionnaireId, clinicId])

  // 編集中の質問が変更されたらeditDataを更新
  useEffect(() => {
    if (editingQuestion) {
      setEditData({
        question_text: editingQuestion.question_text,
        question_type: editingQuestion.question_type,
        options: editingQuestion.options || [],
        is_required: editingQuestion.is_required,
        section_name: editingQuestion.section_name,
        sort_order: editingQuestion.sort_order,
        linked_field: (editingQuestion as any).linked_field || ''
      })
    }
  }, [editingQuestion])

  // セクション一覧を取得
  const sections = Array.from(new Set(questions.map(q => q.section_name).filter(Boolean))).sort((a, b) => {
    const order = ['患者情報', '主訴・症状', '問診', '歯科疾患管理', '同意事項']
    return order.indexOf(a) - order.indexOf(b)
  })

  // 現在のセクションの質問を取得
  const currentQuestions = questions.filter(q => q.section_name === currentSection)

  // 患者情報フィールドの日本語名マッピング
  const patientFieldLabels: { [key: string]: string } = {
    'last_name': '姓',
    'first_name': '名',
    'last_name_kana': '姓（カナ）',
    'first_name_kana': '名（カナ）',
    'gender': '性別',
    'birth_date': '生年月日',
    'postal_code': '郵便番号',
    'address': '住所',
    'phone': '電話番号',
    'email': 'メールアドレス',
    'emergency_contact': '緊急連絡先',
    'referral_source': '来院のきっかけ',
    'preferred_contact_method': '希望連絡方法',
    'allergies': 'アレルギー',
    'medical_history': '既往歴・持病',
    'medications': '服用中の薬'
  }

  // 質問が患者基本情報と連携しているかチェック
  const isLinkedToPatient = (question: QuestionnaireQuestion) => {
    return !!(question as any).linked_field
  }

  // 連携先のフィールド名を取得
  const getLinkedFieldName = (question: QuestionnaireQuestion) => {
    const linkedField = (question as any).linked_field
    return linkedField ? patientFieldLabels[linkedField] || linkedField : ''
  }

  // 質問タイプのラベル取得
  const getQuestionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      text: 'テキスト入力',
      textarea: 'テキストエリア',
      number: '数値入力',
      date: '日付選択',
      radio: 'ラジオボタン',
      checkbox: 'チェックボックス',
      select: 'セレクトボックス'
    }
    return labels[type] || type
  }

  // 条件分岐ロジックをチェックして質問の必須/任意を判定
  const isQuestionRequired = (question: QuestionnaireQuestion) => {
    if (!question.conditional_logic) {
      return question.is_required
    }

    const logic = question.conditional_logic as {
      depends_on?: string
      condition?: string
      value?: any
      required_when?: boolean
    }

    if (!logic.depends_on) {
      return question.is_required
    }

    const dependentValue = formData[logic.depends_on]
    let conditionMet = false

    switch (logic.condition) {
      case 'equals':
        conditionMet = dependentValue === logic.value
        break
      case 'not_equals':
        conditionMet = dependentValue !== logic.value
        break
      case 'contains':
        conditionMet = Array.isArray(dependentValue) 
          ? dependentValue.includes(logic.value)
          : String(dependentValue).includes(String(logic.value))
        break
      case 'not_contains':
        conditionMet = Array.isArray(dependentValue)
          ? !dependentValue.includes(logic.value)
          : !String(dependentValue).includes(String(logic.value))
        break
      case 'is_empty':
        conditionMet = !dependentValue || (Array.isArray(dependentValue) && dependentValue.length === 0)
        break
      case 'is_not_empty':
        conditionMet = !!dependentValue && (!Array.isArray(dependentValue) || dependentValue.length > 0)
        break
      default:
        return question.is_required
    }

    // 条件が満たされた場合の必須/任意の設定
    if (conditionMet && logic.required_when !== undefined) {
      return logic.required_when
    }

    return question.is_required
  }

  // フォームデータ更新
  const updateFormData = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }))
    
    // エラーをクリア
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  // チェックボックスの値を更新
  const updateCheckboxValue = (questionId: string, option: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = (prev[questionId] as string[]) || []
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentValues, option]
        }
      } else {
        return {
          ...prev,
          [questionId]: currentValues.filter(v => v !== option)
        }
      }
    })
  }

  // バリデーション（編集モードでは不要 - 質問の構造のみを編集）
  const validateForm = () => {
    // 編集モードでは質問の回答をバリデーションする必要はない
    // 質問の構造（質問文が空でないかなど）は個別の質問編集時にチェック済み
    return true
  }

  // 保存処理
  const handleSave = async () => {
    if (!questionnaire) {
      console.error('問診表が見つかりません')
      return
    }

    try {
      setSaving(true)

      console.log('問診表を保存します:', { questionnaireId: questionnaire.id, questionsCount: questions.length })

      // 質問をAPIエンドポイント経由でデータベースに保存
      const response = await fetch('/api/questionnaires/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionnaire_id: questionnaire.id,
          questions: questions
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || '保存に失敗しました')
      }

      const result = await response.json()
      console.log('問診表の保存が完了しました:', result)

      // 更新された問診表データを作成
      const updatedQuestionnaire = {
        ...questionnaire,
        questions: questions,
        updated_at: new Date().toISOString()
      }

      onSave?.(updatedQuestionnaire)
      onClose()
    } catch (error) {
      console.error('問診票保存エラー:', error)
      alert('問診表の保存に失敗しました。エラー: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // 質問の表示/非表示を切り替え
  const toggleQuestionVisibility = (questionId: string) => {
    const updatedQuestions = questions.map(q =>
      q.id === questionId
        ? { ...q, is_hidden: !(q as any).is_hidden }
        : q
    )
    setQuestions(updatedQuestions)
  }

  // ドラッグ&ドロップハンドラー
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const currentQuestions = questions.filter(q => q.section_name === currentSection)
    const otherQuestions = questions.filter(q => q.section_name !== currentSection)

    const draggedQuestion = currentQuestions[draggedIndex]
    const newCurrentQuestions = [...currentQuestions]

    // 配列から削除して新しい位置に挿入
    newCurrentQuestions.splice(draggedIndex, 1)
    newCurrentQuestions.splice(dropIndex, 0, draggedQuestion)

    // 現在のセクションの最小sort_orderを取得
    const minSortOrder = currentQuestions.length > 0
      ? Math.min(...currentQuestions.map(q => q.sort_order))
      : 1

    // sort_orderを更新（セクション内での連番）
    const updatedCurrentQuestions = newCurrentQuestions.map((q, idx) => ({
      ...q,
      sort_order: minSortOrder + idx
    }))

    // すべての質問を結合して更新
    setQuestions([...otherQuestions, ...updatedCurrentQuestions])
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // 質問編集フォーム
  const renderQuestionEditForm = (question: QuestionnaireQuestion) => {
    const addOption = () => {
      setEditData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }))
    }

    const updateOption = (index: number, value: string) => {
      setEditData(prev => ({
        ...prev,
        options: prev.options.map((opt, i) => i === index ? value : opt)
      }))
    }

    const removeOption = (index: number) => {
      setEditData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }))
    }

    const saveQuestion = () => {
      const updatedQuestions = questions.map(q =>
        q.id === question.id
          ? { ...q, ...editData }
          : q
      )
      setQuestions(updatedQuestions)
      setEditingQuestion(null)
    }

    return (
      <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[85vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">質問を編集</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingQuestion(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* 質問文 */}
              <div>
                <Label htmlFor="question_text">質問文</Label>
                <Textarea
                  id="question_text"
                  value={editData.question_text}
                  onChange={(e) => setEditData(prev => ({ ...prev, question_text: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* 質問タイプ */}
              <div>
                <Label htmlFor="question_type">質問タイプ</Label>
                <select
                  id="question_type"
                  value={editData.question_type}
                  onChange={(e) => setEditData(prev => ({ ...prev, question_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">テキスト入力</option>
                  <option value="textarea">テキストエリア</option>
                  <option value="number">数値入力</option>
                  <option value="date">日付選択</option>
                  <option value="radio">ラジオボタン（単一選択）</option>
                  <option value="radio_multiple">ラジオボタン（複数選択可）</option>
                </select>
              </div>

              {/* 選択肢（radio, radio_multipleの場合） */}
              {(editData.question_type === 'radio' || editData.question_type === 'radio_multiple') && (
                <div>
                  <Label>選択肢</Label>
                  <div className="space-y-2">
                    {editData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder="選択肢を入力"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addOption}>
                      <Plus className="w-4 h-4 mr-2" />
                      選択肢を追加
                    </Button>
                  </div>
                </div>
              )}

              {/* セクション */}
              <div>
                <Label htmlFor="section_name">セクション</Label>
                <Input
                  id="section_name"
                  value={editData.section_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, section_name: e.target.value }))}
                />
              </div>

              {/* 患者情報フィールドとの連携 */}
              <div>
                <Label htmlFor="linked_field">患者情報フィールドとの連携</Label>
                <select
                  id="linked_field"
                  value={editData.linked_field || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, linked_field: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">連携なし</option>
                  <option value="last_name">姓</option>
                  <option value="first_name">名</option>
                  <option value="last_name_kana">姓（カナ）</option>
                  <option value="first_name_kana">名（カナ）</option>
                  <option value="gender">性別</option>
                  <option value="birth_date">生年月日</option>
                  <option value="postal_code">郵便番号</option>
                  <option value="address">住所</option>
                  <option value="phone">電話番号</option>
                  <option value="email">メールアドレス</option>
                  <option value="emergency_contact">緊急連絡先</option>
                  <option value="referral_source">来院のきっかけ</option>
                  <option value="preferred_contact_method">希望連絡方法</option>
                  <option value="allergies">アレルギー</option>
                  <option value="medical_history">既往歴・持病</option>
                  <option value="medications">服用中の薬</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  患者情報と自動連携するフィールドを選択できます
                </p>
              </div>

              {/* 必須項目 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_required"
                  checked={editData.is_required}
                  onCheckedChange={(checked) => setEditData(prev => ({ ...prev, is_required: checked as boolean }))}
                />
                <Label htmlFor="is_required">必須項目</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                キャンセル
              </Button>
              <Button onClick={saveQuestion}>
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 質問コンポーネントのレンダリング
  const renderQuestion = (question: QuestionnaireQuestion) => {
    const value = formData[question.id]
    const hasError = !!errors[question.id]

    switch (question.question_type) {
      case 'text':
        return (
          <Input
            value={value as string || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
        )

      case 'textarea':
        return (
          <Textarea
            value={value as string || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
            rows={3}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={value as number || ''}
            onChange={(e) => updateFormData(question.id, e.target.value ? Number(e.target.value) : '')}
            className={hasError ? 'border-red-500' : ''}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            value={value as string || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
          />
        )

      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${question.id}-${index}`}
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => updateFormData(question.id, e.target.value)}
                  className={hasError ? 'border-red-500' : ''}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={(value as string[] || []).includes(option)}
                  onCheckedChange={(checked) => updateCheckboxValue(question.id, option, checked as boolean)}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        )

      case 'select':
        return (
          <Select
            value={value as string || ''}
            onValueChange={(newValue) => updateFormData(question.id, newValue)}
          >
            <option value="">選択してください</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </Select>
        )

      default:
        return <div>未対応の質問タイプです: {question.question_type}</div>
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="p-6 space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              {questionnaire?.name || '読み込み中...'}
            </h2>
            {questionnaire?.description && (
              <p className="text-gray-600 mt-1">{questionnaire.description}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="text-gray-500">問診票を読み込み中...</div>
          </div>
        ) : questionnaire ? (
          <>

            {/* セクションナビゲーション */}
            <div className="flex space-x-0 border-b border-gray-200 mb-4">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => setCurrentSection(section)}
                  className={`px-8 py-4 font-medium text-base transition-colors border-b-2 whitespace-nowrap ${
                    currentSection === section
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>

            {/* 現在のセクションの質問 */}
            <Card>
        <CardContent className="space-y-6 pt-6 min-h-[400px]">
          {currentQuestions.map((question, index) => {
            const isRequired = isQuestionRequired(question)
            const isHidden = (question as any).is_hidden
            return (
              <div
                key={question.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`border rounded-lg p-3 cursor-move ${
                  isHidden
                    ? 'border-gray-300 bg-gray-50 opacity-60'
                    : 'border-gray-200'
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                      <h3 className="font-medium text-gray-900">{question.question_text}</h3>
                      {question.is_required && (
                        <span className="text-red-600 font-bold">※</span>
                      )}
                      {isLinkedToPatient(question) && (
                        <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                          🔗 {getLinkedFieldName(question)}と連携
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    <button
                      onClick={() => toggleQuestionVisibility(question.id)}
                      title={(question as any).is_hidden ? "表示する" : "非表示にする"}
                      className="hover:opacity-70 transition-opacity"
                    >
                      {(question as any).is_hidden ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingQuestion(question)}
                      title="編集"
                      className="hover:opacity-70 transition-opacity"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('この質問を削除しますか？')) {
                          setQuestions(prev => prev.filter(q => q.id !== question.id))
                        }
                      }}
                      className="hover:opacity-70 transition-opacity"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* 質問を追加ボタン */}
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newQuestion: QuestionnaireQuestion = {
                  id: `temp-${Date.now()}`,
                  question_text: '新しい質問',
                  question_type: 'text',
                  options: [],
                  is_required: false,
                  section_name: currentSection,
                  sort_order: currentQuestions.length + 1,
                  conditional_logic: null
                }
                setQuestions(prev => [...prev, newQuestion])
                setEditingQuestion(newQuestion)
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              質問を追加
            </Button>
          </div>
        </CardContent>
            </Card>

            {/* フッター */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-500">
                * 印の項目は必須です
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  キャンセル
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center p-8">
            <div className="text-red-500">問診票が見つかりません</div>
          </div>
        )}
      </div>

      {/* 質問編集フォーム */}
      {editingQuestion && renderQuestionEditForm(editingQuestion)}
    </Modal>
  )
}
