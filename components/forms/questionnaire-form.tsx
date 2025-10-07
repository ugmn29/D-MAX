'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getQuestionnaires, createQuestionnaireResponse, type Questionnaire, type QuestionnaireQuestion } from '@/lib/api/questionnaires'
import { getAddressFromPostalCode, formatPostalCode, validatePostalCode } from '@/lib/utils/postal-code'

interface QuestionnaireFormProps {
  clinicId: string
  patientId?: string
  appointmentId?: string
  questionnaireId?: string // 編集モード用
  onSave?: (responseId: string) => void
  onCancel?: () => void
}

interface FormData {
  [key: string]: string | string[] | number | boolean
}

export function QuestionnaireForm({ clinicId, patientId, appointmentId, questionnaireId, onSave, onCancel }: QuestionnaireFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([])
  const [formData, setFormData] = useState<FormData>({})
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showErrors, setShowErrors] = useState(false) // エラー表示フラグ

  // データ読み込み
  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setLoading(true)
        const questionnaires = await getQuestionnaires(clinicId)
        
        let targetQuestionnaire: Questionnaire | null = null
        
        if (questionnaireId) {
          // 編集モード：指定されたIDの問診票を取得
          targetQuestionnaire = questionnaires.find(q => q.id === questionnaireId) || null
        } else {
          // 新規作成モード：デフォルトの問診票を取得
          targetQuestionnaire = questionnaires.find(q => q.name === '初診問診票') || questionnaires[0]
        }
        
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
  }, [clinicId, questionnaireId])

  // 質問をsort_order順でソート
  const sortedQuestions = [...questions].sort((a, b) => a.sort_order - b.sort_order)

  // 条件分岐ロジックをチェックして質問の必須/任意を判定
  const isQuestionRequired = (question: QuestionnaireQuestion) => {
    console.log(`isQuestionRequired: ${question.id} - 条件分岐ロジック:`, question.conditional_logic)
    
    if (!question.conditional_logic) {
      console.log(`isQuestionRequired: ${question.id} - 条件分岐なし、基本必須: ${question.is_required}`)
      return question.is_required
    }

    const logic = question.conditional_logic as {
      depends_on?: string
      condition?: string
      value?: any
      required_when?: boolean
    }

    if (!logic.depends_on) {
      console.log(`isQuestionRequired: ${question.id} - depends_onなし、基本必須: ${question.is_required}`)
      return question.is_required
    }

    const dependentValue = formData[logic.depends_on]
    console.log(`isQuestionRequired: ${question.id} - 依存値(${logic.depends_on}):`, dependentValue)
    
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
        console.log(`isQuestionRequired: ${question.id} - 未知の条件、基本必須: ${question.is_required}`)
        return question.is_required
    }

    console.log(`isQuestionRequired: ${question.id} - 条件(${logic.condition}): ${conditionMet}`)

    // 条件が満たされた場合の必須/任意の設定
    if (conditionMet && logic.required_when !== undefined) {
      console.log(`isQuestionRequired: ${question.id} - 条件満たされ、required_when: ${logic.required_when}`)
      return logic.required_when
    }

    console.log(`isQuestionRequired: ${question.id} - 最終結果: ${question.is_required}`)
    return question.is_required
  }

  // 郵便番号から住所を自動入力
  const handlePostalCodeChange = async (questionId: string, value: string) => {
    // 郵便番号をフォーマット
    const formattedPostalCode = formatPostalCode(value)
    
    setFormData(prev => ({
      ...prev,
      [questionId]: formattedPostalCode
    }))
    
    // 郵便番号が7桁の場合、住所を自動取得（開発環境では無効化）
    if (validatePostalCode(formattedPostalCode)) {
      try {
        const addressData = await getAddressFromPostalCode(formattedPostalCode)
        if (addressData) {
          // 住所フィールドを自動入力
          const addressQuestionId = questions.find(q => 
            q.question_text === '住所' && 
            q.sort_order === questions.find(q => q.id === questionId)?.sort_order! + 1
          )?.id
          
          if (addressQuestionId) {
            setFormData(prev => ({
              ...prev,
              [addressQuestionId]: addressData.full_address
            }))
          }
        }
      } catch (error) {
        // エラーを無視（開発環境では郵便番号APIが無効化されているため）
        console.log('住所自動入力は開発環境では無効化されています')
      }
    }
  }

  // フォームデータ更新
  const updateFormData = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }))
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
    
    console.log('バリデーション開始')
    console.log('ソート済み質問数:', sortedQuestions.length)
    
    sortedQuestions.forEach(question => {
      const isRequired = isQuestionRequired(question)
      console.log(`質問 ${question.id} (${question.question_text}): 必須=${isRequired}`)
      
      if (isRequired) {
        const value = formData[question.id]
        console.log(`質問 ${question.id} の値:`, value)
        
        if (!value || (Array.isArray(value) && value.length === 0)) {
          console.log(`質問 ${question.id} でバリデーションエラー`)
          newErrors[question.id] = question.question_text
        } else {
          console.log(`質問 ${question.id} は正常`)
        }
      }
    })
    
    console.log('バリデーション結果:', newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 保存処理
  const handleSave = async () => {
    console.log('問診票送信開始')
    console.log('フォームデータ:', formData)
    
    // バリデーションを実行
    if (!validateForm()) {
      console.log('バリデーション失敗')
      setShowErrors(true) // エラー表示を有効化
      // ページトップにスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    console.log('バリデーション成功')

    if (!questionnaire) {
      console.log('問診票が選択されていません')
      return
    }

    try {
      setSaving(true)
      console.log('送信処理開始')
      
      // 患者情報を自動で追加
      const enhancedFormData = {
        ...formData,
        patient_name: formData['q1-1'] || '',
        patient_name_kana: formData['q1-2'] || '',
        patient_phone: formData['q1-10'] || formData['q1-9'] || '',
        patient_email: formData['q1-11'] || ''
      }
      
      console.log('拡張フォームデータ:', enhancedFormData)
      console.log('患者名:', enhancedFormData.patient_name)
      console.log('電話番号:', enhancedFormData.patient_phone)
      
      const responseData = {
        questionnaire_id: questionnaire.id,
        patient_id: patientId,
        appointment_id: appointmentId,
        response_data: enhancedFormData,
        completed_at: new Date().toISOString()
      }

      console.log('送信データ:', responseData)
      const responseId = await createQuestionnaireResponse(responseData)
      console.log('問診票送信完了:', responseId)
      
      // 送信後に未連携問診票数を確認
      const { getCurrentUnlinkedCount } = await import('@/lib/api/questionnaires')
      const currentCount = getCurrentUnlinkedCount()
      console.log('送信後の未連携問診票数:', currentCount)
      
      onSave?.(responseId)
      console.log('onSaveコールバック実行完了')
    } catch (error) {
      console.error('問診票保存エラー:', error)
    } finally {
      setSaving(false)
    }
  }

  // 質問コンポーネントのレンダリング
  const renderQuestion = (question: QuestionnaireQuestion) => {
    const value = formData[question.id]
    const hasError = !!errors[question.id]

    switch (question.question_type) {
      case 'text':
        // 郵便番号フィールドの特別処理
        if (question.question_text === '郵便番号') {
          return (
            <Input
              value={value as string || ''}
              onChange={(e) => handlePostalCodeChange(question.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
              placeholder={question.placeholder || '例: 123-4567'}
              maxLength={8}
            />
          )
        }
        
        // 住所フィールドの特別処理
        if (question.question_text === '住所') {
          return (
            <Input
              value={value as string || ''}
              onChange={(e) => updateFormData(question.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
              placeholder={question.placeholder || '住所を入力してください'}
            />
          )
        }
        
        return (
          <Input
            value={value as string || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
            placeholder={question.placeholder}
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
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return <div>未対応の質問タイプです: {question.question_type}</div>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">問診票を読み込み中...</div>
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-500">問診票が見つかりません</div>
      </div>
    )
  }

  // エラーがあるかどうかをチェック
  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="space-y-6">
      {/* エラーサマリー（送信ボタンを押した後のみ表示、sticky） */}
      {showErrors && hasErrors && (
        <div className="sticky top-0 z-50 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">入力に不備があります</h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2">以下の項目を入力してください：</p>
                <ul className="list-disc list-inside space-y-1">
                  {Object.values(errors).map((errorMsg, index) => (
                    <li key={index}>{errorMsg}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {questionnaireId ? '問診票編集' : '問診票作成'}: {questionnaire.name}
          </h1>
          {questionnaire.description && (
            <p className="text-gray-600 mt-1">{questionnaire.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          <Button 
            onClick={() => {
              console.log('送信ボタンクリック')
              handleSave()
            }} 
            disabled={saving}
          >
            {saving ? '送信中...' : '送信'}
          </Button>
        </div>
      </div>

      {/* 質問一覧 */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          {sortedQuestions.map((question) => {
            const isRequired = isQuestionRequired(question)
            return (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.id} className="font-medium">
                  {question.question_text}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderQuestion(question)}
                {errors[question.id] && (
                  <p className="text-red-500 text-sm">{errors[question.id]}</p>
                )}
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
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
          <Button 
            onClick={() => {
              console.log('送信ボタンクリック')
              handleSave()
            }} 
            disabled={saving}
          >
            {saving ? '送信中...' : '送信'}
          </Button>
        </div>
      </div>
    </div>
  )
}
