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
import { Edit, Save, X, Plus, Trash2, GripVertical } from 'lucide-react'

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

  // セクション一覧を取得
  const sections = Array.from(new Set(questions.map(q => q.section_name))).sort((a, b) => {
    const order = ['患者情報', '主訴・症状', '問診', '歯科疾患管理', '同意事項']
    return order.indexOf(a) - order.indexOf(b)
  })

  // 現在のセクションの質問を取得
  const currentQuestions = questions.filter(q => q.section_name === currentSection)

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

  // バリデーション
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    currentQuestions.forEach(question => {
      const isRequired = isQuestionRequired(question)
      if (isRequired) {
        const value = formData[question.id]
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[question.id] = 'この項目は必須です'
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 保存処理
  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    if (!questionnaire) return

    try {
      setSaving(true)
      
      // ここで実際の保存処理を行う
      // 現在はモックとして、元のデータをそのまま返す
      const updatedQuestionnaire = {
        ...questionnaire,
        updated_at: new Date().toISOString()
      }
      
      onSave?.(updatedQuestionnaire)
      onClose()
    } catch (error) {
      console.error('問診票保存エラー:', error)
    } finally {
      setSaving(false)
    }
  }

  // 質問編集フォーム
  const renderQuestionEditForm = (question: QuestionnaireQuestion) => {
    const [editData, setEditData] = useState({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || [],
      is_required: question.is_required,
      section_name: question.section_name,
      sort_order: question.sort_order
    })

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
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
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
                <Select
                  value={editData.question_type}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, question_type: value }))}
                >
                  <option value="text">テキスト入力</option>
                  <option value="textarea">テキストエリア</option>
                  <option value="number">数値入力</option>
                  <option value="date">日付選択</option>
                  <option value="radio">ラジオボタン</option>
                  <option value="checkbox">チェックボックス</option>
                  <option value="select">セレクトボックス</option>
                </Select>
              </div>

              {/* 選択肢（radio, checkbox, selectの場合） */}
              {(editData.question_type === 'radio' || editData.question_type === 'checkbox' || editData.question_type === 'select') && (
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

              {/* 並び順 */}
              <div>
                <Label htmlFor="sort_order">並び順</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={editData.sort_order}
                  onChange={(e) => setEditData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
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
              <Edit className="w-6 h-6 mr-2" />
              問診票編集: {questionnaire?.name || '読み込み中...'}
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
            <div className="flex space-x-2 overflow-x-auto">
              {sections.map((section) => (
                <Button
                  key={section}
                  variant={currentSection === section ? 'default' : 'outline'}
                  onClick={() => setCurrentSection(section)}
                  className="whitespace-nowrap"
                >
                  {section}
                </Button>
              ))}
            </div>

            {/* 現在のセクションの質問 */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{currentSection}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {currentQuestions.length}件の質問
                    </p>
                  </div>
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
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    質問を追加
                  </Button>
                </div>
              </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestions.map((question, index) => {
            const isRequired = isQuestionRequired(question)
            return (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                      {question.is_required && (
                        <Badge variant="destructive" className="text-xs">
                          必須
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{question.question_text}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>タイプ: {getQuestionTypeLabel(question.question_type)}</span>
                      <span>並び順: {question.sort_order}</span>
                    </div>
                    {question.options && question.options.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">選択肢:</div>
                        <div className="flex flex-wrap gap-1">
                          {question.options.map((option, optIndex) => (
                            <span key={optIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingQuestion(question)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('この質問を削除しますか？')) {
                          setQuestions(prev => prev.filter(q => q.id !== question.id))
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      削除
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
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
