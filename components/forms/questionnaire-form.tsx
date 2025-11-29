'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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
          setQuestions(targetQuestionnaire.questions || [])

          // フォームデータの初期化
          const initialData: FormData = {}
          const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD形式

          ;(targetQuestionnaire.questions || []).forEach(q => {
            if (q.question_type === 'checkbox') {
              initialData[q.id] = []
            } else if (q.question_type === 'date' && q.question_text === '受診日') {
              // 受診日フィールドには今日の日付を自動設定
              initialData[q.id] = today
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

  // 条件付きロジックの評価（共通関数）
  const evaluateCondition = (logic: any): boolean => {
    if (!logic) return true

    // show_when形式の条件付きロジック
    if (logic.show_when) {
      const showWhen = logic.show_when

      // question_textで依存する質問を見つける
      if (showWhen.question_text) {
        const dependentQuestion = questions.find(q => q.question_text === showWhen.question_text)
        if (!dependentQuestion) return true

        const dependentValue = formData[dependentQuestion.id]

        // valueと一致するかチェック
        if (showWhen.value) {
          const operator = showWhen.operator || 'equals'

          switch (operator) {
            case 'equals':
              return dependentValue === showWhen.value
            case 'contains':
              // チェックボックス（配列）の場合
              if (Array.isArray(dependentValue)) {
                return dependentValue.includes(showWhen.value)
              }
              // テキストの場合
              return String(dependentValue).includes(String(showWhen.value))
            case 'not_equals':
              return dependentValue !== showWhen.value
            case 'not_contains':
              if (Array.isArray(dependentValue)) {
                return !dependentValue.includes(showWhen.value)
              }
              return !String(dependentValue).includes(String(showWhen.value))
            default:
              return dependentValue === showWhen.value
          }
        }
      }

      return true
    }

    // depends_on形式の条件付きロジック（既存の形式）
    if (!logic.depends_on) return true

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
        return true
    }

    return conditionMet
  }

  // 質問を表示するかどうかを判定
  const shouldShowQuestion = (question: QuestionnaireQuestion): boolean => {
    if (!question.conditional_logic) return true
    return evaluateCondition(question.conditional_logic)
  }

  // 条件分岐ロジックをチェックして質問の必須/任意を判定
  const isQuestionRequired = (question: QuestionnaireQuestion) => {
    // 質問が表示されない場合は必須ではない
    if (!shouldShowQuestion(question)) return false

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
      show_when?: any
    }

    // show_when形式の場合は、表示されていれば基本のis_requiredを使用
    if (logic.show_when) {
      return question.is_required
    }

    if (!logic.depends_on) {
      console.log(`isQuestionRequired: ${question.id} - depends_onなし、基本必須: ${question.is_required}`)
      return question.is_required
    }

    const conditionMet = evaluateCondition(logic)
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

      // linked_fieldから患者情報を抽出
      let patientName = ''
      let patientNameKana = ''
      let homePhone = ''
      let mobilePhone = ''
      let patientEmail = ''

      console.log('患者情報抽出開始 - 質問数:', questions.length)
      console.log('フォームデータのキー数:', Object.keys(formData).length)

      // 質問のlinked_fieldを確認して、患者情報を抽出
      questions.forEach(q => {
        const value = formData[q.id]

        if (q.linked_field === 'name' && value) {
          patientName = String(value)
          console.log('✅ 患者名を設定:', patientName, '(質問ID:', q.id, ')')
        } else if (q.linked_field === 'furigana_kana' && value) {
          patientNameKana = String(value)
          console.log('✅ フリガナを設定:', patientNameKana, '(質問ID:', q.id, ')')
        } else if (q.linked_field === 'home_phone' && value) {
          homePhone = String(value)
          console.log('✅ 自宅電話番号を設定:', homePhone, '(質問ID:', q.id, ')')
        } else if (q.linked_field === 'phone' && value) {
          mobilePhone = String(value)
          console.log('✅ 携帯電話番号を設定:', mobilePhone, '(質問ID:', q.id, ')')
        } else if (q.linked_field === 'email' && value) {
          patientEmail = String(value)
          console.log('✅ メールを設定:', patientEmail, '(質問ID:', q.id, ')')
        }
      })

      // 電話番号を統合
      let patientPhone = ''
      if (homePhone && mobilePhone) {
        patientPhone = `自宅: ${homePhone} / 携帯: ${mobilePhone}`
        console.log('✅ 電話番号を統合:', patientPhone)
      } else if (mobilePhone) {
        patientPhone = mobilePhone
        console.log('✅ 携帯電話番号のみ:', patientPhone)
      } else if (homePhone) {
        patientPhone = homePhone
        console.log('✅ 自宅電話番号のみ:', patientPhone)
      }

      console.log('抽出結果 - 名前:', patientName, ', 電話:', patientPhone)

      // 患者情報を自動で追加
      const enhancedFormData = {
        ...formData,
        patient_name: patientName,
        patient_name_kana: patientNameKana,
        patient_phone: patientPhone,
        patient_email: patientEmail
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

      case 'tel':
        return (
          <Input
            type="tel"
            value={value as string || ''}
            onChange={(e) => updateFormData(question.id, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
            placeholder={question.placeholder || '例: 090-1234-5678'}
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
          {sortedQuestions.map((question, index) => {
            // is_hiddenが true の質問は表示しない
            if ((question as any).is_hidden) {
              return null
            }

            // 条件付きロジックで質問を表示するかチェック
            if (!shouldShowQuestion(question)) {
              return null
            }

            const isRequired = isQuestionRequired(question)

            // 前の質問と比較してセクションが変わったかチェック
            const previousQuestion = index > 0 ? sortedQuestions[index - 1] : null
            const showSectionHeader = question.section_name && question.section_name.trim() !== '' &&
              (!previousQuestion || previousQuestion.section_name !== question.section_name)

            return (
              <div key={question.id}>
                {/* セクションヘッダー */}
                {showSectionHeader && (
                  <div className="mb-4 pb-2 border-b-2 border-gray-300">
                    <h3 className="text-lg font-bold text-gray-800">{question.section_name}</h3>
                  </div>
                )}

                {/* 質問 */}
                <div className="space-y-2 mb-6">
                  <Label htmlFor={question.id} className="font-medium">
                    {question.question_text}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {renderQuestion(question)}
                  {errors[question.id] && (
                    <p className="text-red-500 text-sm">{errors[question.id]}</p>
                  )}
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
