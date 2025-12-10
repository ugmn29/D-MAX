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
import { getQuestionnaires, updateQuestionnaire, type Questionnaire, type QuestionnaireQuestion } from '@/lib/api/questionnaires'
import { Edit, Save, X, Plus, Trash2, GripVertical, Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react'

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
  const [cClassificationMappings, setCClassificationMappings] = useState<Record<string, string[]>>({})

  // 問診票基本情報の編集用state
  const [editingBasicInfo, setEditingBasicInfo] = useState(false)
  const [basicInfoData, setBasicInfoData] = useState({
    name: '',
    description: '',
    is_active: true
  })
  const [editData, setEditData] = useState<{
    question_text: string
    question_type: string
    options: string[]
    is_required: boolean
    section_name: string
    sort_order: number
    linked_field?: string
    conditional_logic?: any
    c_classification_items?: string[]
  }>({
    question_text: '',
    question_type: 'text',
    options: [],
    is_required: false,
    section_name: '',
    sort_order: 0,
    linked_field: '',
    conditional_logic: null,
    c_classification_items: []
  })

  // モーダル関連のstate
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    isDanger?: boolean
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertModalConfig, setAlertModalConfig] = useState<{
    title: string
    message: string
    type?: 'success' | 'error' | 'info'
  }>({
    title: '',
    message: '',
    type: 'info',
  })

  // 未保存変更の追跡
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [initialQuestions, setInitialQuestions] = useState<QuestionnaireQuestion[]>([])

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
          setInitialQuestions(JSON.parse(JSON.stringify(targetQuestionnaire.questions))) // 深いコピー
          setHasUnsavedChanges(false) // 初期読み込み時は未保存フラグをリセット

          // 基本情報の初期化
          setBasicInfoData({
            name: targetQuestionnaire.name,
            description: targetQuestionnaire.description || '',
            is_active: targetQuestionnaire.is_active
          })

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

  // C分類マッピング情報を読み込み
  useEffect(() => {
    if (!isOpen) return

    const loadCClassificationMappings = async () => {
      try {
        const response = await fetch('/api/c-classification-mapping')
        if (response.ok) {
          const data = await response.json()
          setCClassificationMappings(data.mappings || {})
        }
      } catch (error) {
        console.error('C分類マッピング読み込みエラー:', error)
      }
    }

    loadCClassificationMappings()
  }, [isOpen])

  // 質問の変更を検知して未保存フラグを立てる
  useEffect(() => {
    if (initialQuestions.length === 0) return // 初期読み込み前はスキップ

    // 質問の内容が変更されたかチェック
    const hasChanged = JSON.stringify(questions) !== JSON.stringify(initialQuestions)
    setHasUnsavedChanges(hasChanged)
  }, [questions, initialQuestions])

  // 編集中の質問が変更されたらeditDataを更新
  useEffect(() => {
    if (editingQuestion) {
      // この質問に紐づくC分類項目を取得
      const mappingKey = `${editingQuestion.section_name}::${editingQuestion.question_text}`
      const linkedCItems = cClassificationMappings[mappingKey] || []

      setEditData({
        question_text: editingQuestion.question_text,
        question_type: editingQuestion.question_type,
        options: editingQuestion.options || [],
        is_required: editingQuestion.is_required,
        section_name: editingQuestion.section_name,
        sort_order: editingQuestion.sort_order,
        linked_field: (editingQuestion as any).linked_field || '',
        conditional_logic: editingQuestion.conditional_logic || null,
        c_classification_items: linkedCItems
      })
    }
  }, [editingQuestion, cClassificationMappings])

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

  // 汎用確認ダイアログヘルパー
  const showConfirm = (
    message: string,
    onConfirm: () => void,
    options?: {
      title?: string
      confirmText?: string
      cancelText?: string
      isDanger?: boolean
    }
  ) => {
    setConfirmModalConfig({
      title: options?.title || '確認',
      message,
      confirmText: options?.confirmText || 'OK',
      cancelText: options?.cancelText || 'キャンセル',
      onConfirm,
      isDanger: options?.isDanger || false,
    })
    setShowConfirmModal(true)
  }

  // 汎用アラートヘルパー
  const showAlert = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    title?: string
  ) => {
    setAlertModalConfig({
      title: title || (type === 'error' ? 'エラー' : type === 'success' ? '成功' : '通知'),
      message,
      type,
    })
    setShowAlertModal(true)
  }

  // 基本情報の保存
  const handleSaveBasicInfo = async () => {
    if (!questionnaire) return

    try {
      setSaving(true)
      await updateQuestionnaire(clinicId, questionnaire.id, {
        name: basicInfoData.name,
        description: basicInfoData.description,
        is_active: basicInfoData.is_active
      })

      // ローカルの問診票データを更新
      const updatedQuestionnaire = {
        ...questionnaire,
        name: basicInfoData.name,
        description: basicInfoData.description,
        is_active: basicInfoData.is_active
      }
      setQuestionnaire(updatedQuestionnaire)

      // 親コンポーネントに通知
      if (onSave) {
        onSave(updatedQuestionnaire)
      }

      setEditingBasicInfo(false)
      showAlert('問診票の基本情報を更新しました', 'success')
    } catch (error) {
      console.error('基本情報の保存エラー:', error)
      showAlert('基本情報の保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 未保存の変更があるかチェックしてモーダルを閉じる
  const handleClose = () => {
    if (hasUnsavedChanges) {
      showConfirm(
        '保存されていない変更があります。\n変更を破棄してモーダルを閉じますか？',
        () => {
          setHasUnsavedChanges(false)
          onClose()
        },
        { isDanger: true, confirmText: '破棄して閉じる' }
      )
    } else {
      onClose()
    }
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
        throw new Error(errorData.message || errorData.error || '保存に失敗しました')
      }

      const result = await response.json()
      console.log('問診表の保存が完了しました:', result)

      // 更新された問診表データを作成
      const updatedQuestionnaire = {
        ...questionnaire,
        questions: questions,
        updated_at: new Date().toISOString()
      }

      // 保存成功したら未保存フラグをクリア
      setHasUnsavedChanges(false)
      setInitialQuestions(JSON.parse(JSON.stringify(questions))) // 保存後の状態を新しい初期状態とする

      onSave?.(updatedQuestionnaire)
      onClose()
    } catch (error) {
      console.error('問診票保存エラー:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      showAlert(`問診表の保存に失敗しました\n\nエラー: ${errorMessage}`, 'error')
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

  // C分類項目の定義
  const C_CLASSIFICATION_ITEMS = [
    { value: 'C-1', label: 'C-1: 歯の欠損がある' },
    { value: 'C-2', label: 'C-2: 口唇・口蓋裂等がある' },
    { value: 'C-3', label: 'C-3: 舌小帯、上唇小帯に異常がある' },
    { value: 'C-4', label: 'C-4: 口唇閉鎖不全がある' },
    { value: 'C-5', label: 'C-5: 食べこぼしがある' },
    { value: 'C-6', label: 'C-6: 口腔習癖がある' },
    { value: 'C-7', label: 'C-7: 歯の萌出に遅れがある' },
    { value: 'C-8', label: 'C-8: 咀嚼に時間がかかる・咀嚼ができない' },
    { value: 'C-9', label: 'C-9: 咬み合わせに異常がある' },
    { value: 'C-10', label: 'C-10: 鼻呼吸の障害がある' },
    { value: 'C-11', label: 'C-11: 口で呼吸する癖がある' },
    { value: 'C-12', label: 'C-12: 咀嚼時、舌の動きに問題がある' },
    { value: 'C-13', label: 'C-13: 身長、体重の増加に問題がある' },
    { value: 'C-14', label: 'C-14: 食べ方が遅い' },
    { value: 'C-15', label: 'C-15: 偏食がある' },
    { value: 'C-16', label: 'C-16: 睡眠時のいびきがある' },
    { value: 'C-17', label: 'C-17: その他の症状' },
  ]

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

    const toggleCClassificationItem = (cItem: string) => {
      setEditData(prev => {
        const currentItems = prev.c_classification_items || []
        const newItems = currentItems.includes(cItem)
          ? currentItems.filter(item => item !== cItem)
          : [...currentItems, cItem]
        return {
          ...prev,
          c_classification_items: newItems
        }
      })
    }

    const saveQuestion = async () => {
      const updatedQuestions = questions.map(q =>
        q.id === question.id
          ? {
              ...q,
              question_text: editData.question_text,
              question_type: editData.question_type,
              options: editData.options,
              is_required: editData.is_required,
              section_name: editData.section_name,
              conditional_logic: editData.conditional_logic,
              linked_field: editData.linked_field,
              // IDとsort_orderは保持
            }
          : q
      )
      setQuestions(updatedQuestions)

      // C分類マッピング情報を更新
      const oldMappingKey = `${question.section_name}::${question.question_text}`
      const newMappingKey = `${editData.section_name}::${editData.question_text}`

      // ローカルのマッピング情報を更新
      const updatedMappings = { ...cClassificationMappings }
      delete updatedMappings[oldMappingKey]
      if (editData.c_classification_items && editData.c_classification_items.length > 0) {
        updatedMappings[newMappingKey] = editData.c_classification_items
      }
      setCClassificationMappings(updatedMappings)

      // データベースに保存（質問保存時に一緒に保存）
      try {
        await fetch('/api/c-classification-mapping', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section_name: editData.section_name,
            question_text: editData.question_text,
            c_classification_items: editData.c_classification_items || []
          })
        })
      } catch (error) {
        console.error('C分類マッピング保存エラー:', error)
      }

      setEditingQuestion(null)
    }

    return (
      <div className="fixed inset-0 z-[70] bg-black bg-opacity-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[85vh] overflow-y-auto z-[71]">
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

              {/* C分類との連携 */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">口腔機能発達不全症（C分類）との連携</Label>
                <p className="text-sm text-gray-600 mb-3">
                  この質問が関連するC分類項目を選択してください。選択した項目は自動評価の対象になります。
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border rounded-md p-3 bg-gray-50">
                  {C_CLASSIFICATION_ITEMS.map((item) => (
                    <div key={item.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`c-item-${item.value}`}
                        checked={(editData.c_classification_items || []).includes(item.value)}
                        onCheckedChange={() => toggleCClassificationItem(item.value)}
                      />
                      <Label htmlFor={`c-item-${item.value}`} className="text-sm cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {editData.c_classification_items && editData.c_classification_items.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">選択中:</span>
                    {editData.c_classification_items.map((cItem) => (
                      <Badge
                        key={cItem}
                        variant="secondary"
                        className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {cItem}
                      </Badge>
                    ))}
                  </div>
                )}
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
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="xlarge">
      <div className="p-6 space-y-6 max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {editingBasicInfo ? (
              // 編集モード
              <div className="space-y-4 pr-4">
                <div>
                  <Label htmlFor="questionnaire-name">問診票名</Label>
                  <Input
                    id="questionnaire-name"
                    value={basicInfoData.name}
                    onChange={(e) => setBasicInfoData({ ...basicInfoData, name: e.target.value })}
                    placeholder="問診票名を入力"
                  />
                </div>
                <div>
                  <Label htmlFor="questionnaire-description">説明</Label>
                  <Textarea
                    id="questionnaire-description"
                    value={basicInfoData.description}
                    onChange={(e) => setBasicInfoData({ ...basicInfoData, description: e.target.value })}
                    placeholder="説明を入力（任意）"
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="questionnaire-is-active"
                    checked={basicInfoData.is_active}
                    onCheckedChange={(checked) => setBasicInfoData({ ...basicInfoData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="questionnaire-is-active" className="font-medium">
                    この問診票を有効にする
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={handleSaveBasicInfo} disabled={saving} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBasicInfoData({
                        name: questionnaire?.name || '',
                        description: questionnaire?.description || '',
                        is_active: questionnaire?.is_active || true
                      })
                      setEditingBasicInfo(false)
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              // 表示モード
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold">
                    {questionnaire?.name || '読み込み中...'}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      questionnaire?.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {questionnaire?.is_active ? "有効" : "無効"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingBasicInfo(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                {questionnaire?.description && (
                  <p className="text-gray-600 mt-1">{questionnaire.description}</p>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="text-gray-500">問診票を読み込み中...</div>
          </div>
        ) : questionnaire ? (
          <>
            {/* 2カラムレイアウト */}
            <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
              {/* 左カラム：編集エリア */}
              <div className="flex flex-col overflow-hidden">
                {/* セクションナビゲーション */}
                <div className="flex space-x-0 border-b border-gray-200 mb-4 overflow-x-auto">
                  {sections.map((section) => (
                    <button
                      key={section}
                      onClick={() => setCurrentSection(section)}
                      className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
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
                <Card className="flex-1 overflow-hidden flex flex-col">
                  <CardContent className="space-y-4 pt-6 flex-1 overflow-y-auto">
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
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
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
                      {(() => {
                        const mappingKey = `${question.section_name}::${question.question_text}`
                        const cClassifications = cClassificationMappings[mappingKey] || []
                        return cClassifications.map((cItem) => (
                          <Badge
                            key={cItem}
                            variant="secondary"
                            className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                          >
                            {cItem}
                          </Badge>
                        ))
                      })()}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleQuestionVisibility(question.id)
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingQuestion(question)
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      title="編集"
                      className="hover:opacity-70 transition-opacity"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        showConfirm(
                          'この質問を削除しますか？',
                          () => {
                            setQuestions(prev => prev.filter(q => q.id !== question.id))
                          },
                          { isDanger: true, confirmText: '削除' }
                        )
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
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
              </div>

              {/* 右カラム：プレビューエリア */}
              <div className="flex flex-col overflow-hidden border-l border-gray-200 pl-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">プレビュー</h3>
                <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                  {/* 問診表プレビュー */}
                  <div className="bg-white rounded-lg p-6 space-y-6">
                    {questions.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Info className="w-12 h-12 mx-auto mb-2" />
                        <p>質問を追加するとここにプレビューが表示されます</p>
                      </div>
                    ) : (
                      <>
                        {sections.map((section) => {
                          const sectionQuestions = questions
                            .filter(q => q.section_name === section)
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .filter(q => !(q as any).is_hidden)

                          if (sectionQuestions.length === 0) return null

                          return (
                            <div key={section} className="space-y-4">
                              <h4 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-200">
                                {section}
                              </h4>
                              {sectionQuestions.map((question, idx) => (
                                <div key={question.id} className="space-y-2">
                                  <Label className="text-base font-medium">
                                    {idx + 1}. {question.question_text}
                                    {question.is_required && (
                                      <span className="text-red-600 ml-1">*</span>
                                    )}
                                  </Label>
                                  <div className="text-sm text-gray-500">
                                    {/* プレビュー用の質問表示 */}
                                    {question.question_type === 'text' && (
                                      <Input placeholder="テキスト入力" disabled className="bg-gray-50" />
                                    )}
                                    {question.question_type === 'textarea' && (
                                      <Textarea placeholder="テキストエリア" disabled className="bg-gray-50" rows={3} />
                                    )}
                                    {question.question_type === 'number' && (
                                      <Input type="number" placeholder="数値入力" disabled className="bg-gray-50" />
                                    )}
                                    {question.question_type === 'date' && (
                                      <Input type="date" disabled className="bg-gray-50" />
                                    )}
                                    {question.question_type === 'radio' && (
                                      <div className="space-y-2">
                                        {question.options?.map((option, idx) => (
                                          <div key={idx} className="flex items-center space-x-2">
                                            <input type="radio" disabled className="text-gray-400" />
                                            <Label className="text-gray-600">{option}</Label>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {question.question_type === 'checkbox' && (
                                      <div className="space-y-2">
                                        {question.options?.map((option, idx) => (
                                          <div key={idx} className="flex items-center space-x-2">
                                            <Checkbox disabled />
                                            <Label className="text-gray-600">{option}</Label>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {question.question_type === 'select' && (
                                      <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                        <option>選択してください</option>
                                        {question.options?.map((option, idx) => (
                                          <option key={idx}>{option}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* フッター */}
            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <div className="text-sm text-gray-500">
                * 印の項目は必須です
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleClose}>
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
    </Modal>

    {/* 質問編集フォーム */}
    {editingQuestion && renderQuestionEditForm(editingQuestion)}

    {/* 汎用確認モーダル */}
    <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={confirmModalConfig.title}
        zIndex="z-[80]"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertCircle className={`w-12 h-12 ${confirmModalConfig.isDanger ? 'text-red-500' : 'text-blue-500'}`} />
            </div>
            <div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {confirmModalConfig.message}
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowConfirmModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              {confirmModalConfig.cancelText || 'キャンセル'}
            </Button>
            <Button
              onClick={() => {
                confirmModalConfig.onConfirm()
                setShowConfirmModal(false)
              }}
              className={confirmModalConfig.isDanger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'}
            >
              {confirmModalConfig.confirmText || 'OK'}
            </Button>
          </div>
        </div>
    </Modal>

    {/* 汎用通知モーダル */}
    <Modal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title={alertModalConfig.title}
        zIndex="z-[80]"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {alertModalConfig.type === 'success' && (
                <CheckCircle className="w-12 h-12 text-green-500" />
              )}
              {alertModalConfig.type === 'error' && (
                <AlertCircle className="w-12 h-12 text-red-500" />
              )}
              {alertModalConfig.type === 'info' && (
                <Info className="w-12 h-12 text-blue-500" />
              )}
            </div>
            <div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {alertModalConfig.message}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowAlertModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </div>
        </div>
    </Modal>
  </>
  )
}
