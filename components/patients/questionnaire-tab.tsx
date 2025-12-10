'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Unlink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import {
  getLinkedQuestionnaireResponses,
  getUnlinkedQuestionnaireResponses,
  unlinkQuestionnaireResponse,
  QuestionnaireResponse,
  getQuestionnaires
} from '@/lib/api/questionnaires'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { OralFunctionAssessmentPanel } from './oral-function-assessment-panel'

interface QuestionnaireTabProps {
  patientId: string
}

type QuestionnaireType = 'display' | 'habit'

// 患者情報フィールドのラベルマップ
const patientFieldLabels: { [key: string]: string } = {
  name: '氏名',
  furigana_kana: 'フリガナ',
  birth_date: '生年月日',
  gender: '性別',
  phone: '電話番号',
  email: 'メールアドレス',
  postal_code: '郵便番号',
  address: '住所',
  referral_source: '紹介元',
  preferred_contact_method: '希望連絡方法',
  allergies: 'アレルギー',
  medical_history: '既往歴',
  medications: '服用薬'
}

export function QuestionnaireTab({ patientId }: QuestionnaireTabProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // URLパラメータから問診票タイプを読み取り（デフォルトは'display'）
  const questionnaireType = (searchParams.get('questionnaireType') as QuestionnaireType) || 'display'
  const [activeType, setActiveType] = useState<QuestionnaireType>(questionnaireType)

  const [questionnaireResponses, setQuestionnaireResponses] = useState<QuestionnaireResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questionnaireDefinitions, setQuestionnaireDefinitions] = useState<Map<string, any>>(new Map())
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set())

  // URLパラメータが変更されたら activeType を更新
  useEffect(() => {
    setActiveType(questionnaireType)
  }, [questionnaireType])

  useEffect(() => {
    loadQuestionnaireResponses()
  }, [patientId])

  // タブ切り替え時にURLを更新
  const handleTypeChange = (type: QuestionnaireType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('questionnaireType', type)
    router.push(`${pathname}?${params.toString()}`)
  }

  const loadQuestionnaireResponses = async () => {
    try {
      setLoading(true)
      setError(null)

      // 連携済みと未連携の両方を取得
      const [linkedResponses, unlinkedResponses] = await Promise.all([
        getLinkedQuestionnaireResponses(patientId),
        getUnlinkedQuestionnaireResponses('11111111-1111-1111-1111-111111111111')
      ])

      console.log('連携済み問診票:', linkedResponses.length, '件')
      console.log('未連携問診票:', unlinkedResponses.length, '件')

      // 両方を結合
      const allResponses = [...linkedResponses, ...unlinkedResponses]

      console.log('全問診票:', allResponses.length, '件')
      console.log('問診票詳細:', allResponses.map(r => ({
        id: r.id,
        questionnaire_id: r.questionnaire_id,
        questionnaire_name: r.questionnaire?.name,
        patient_id: r.patient_id || 'NULL (未連携)',
        response_data_keys: Object.keys(r.response_data || {})
      })))
      console.log('問診票名一覧:', allResponses.map(r => r.questionnaire?.name).filter(Boolean))

      // 問診票の定義を取得（質問IDから質問文を取得するため）
      // 仮のclinicIdを使用（実際の実装では適切なclinicIdを使用）
      const questionnaires = await getQuestionnaires('11111111-1111-1111-1111-111111111111')
      console.log('問診票定義の取得:', questionnaires.length, '件')

      // 問診票IDをキーとして質問のマップを作成
      const questionMap = new Map()
      questionnaires.forEach(q => {
        const qMap = new Map()
        if (q.questions) {
          q.questions.forEach((question: any) => {
            qMap.set(question.id, question)
          })
        }
        questionMap.set(q.id, qMap)
        console.log(`問診票 ${q.name} (${q.id}): ${q.questions?.length || 0}件の質問`)
      })
      setQuestionnaireDefinitions(questionMap)

      setQuestionnaireResponses(allResponses)

      // 全ての問診票をデフォルトで展開状態にする
      // expandedResponseは使用しないので設定不要
    } catch (err) {
      console.error('問診票回答の読み込みエラー:', err)
      setError('問診票回答の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 問診票の連携を解除
  const handleUnlinkResponse = async (responseId: string) => {
    if (!confirm('この問診票の連携を解除しますか？\n患者の医療情報（アレルギー、既往歴、服用薬）もクリアされます。')) {
      return
    }

    try {
      await unlinkQuestionnaireResponse(responseId, patientId)
      console.log('問診票の連携を解除しました:', responseId)
      // 再読み込み
      await loadQuestionnaireResponses()
    } catch (err) {
      console.error('問診票連携解除エラー:', err)
      alert('問診票の連携解除に失敗しました')
    }
  }

  // 折りたたみ状態を切り替え
  const toggleExpanded = (responseId: string) => {
    setExpandedResponses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(responseId)) {
        newSet.delete(responseId)
      } else {
        newSet.add(responseId)
      }
      return newSet
    })
  }

  const formatResponseData = (response: QuestionnaireResponse) => {
    if (!response.response_data) {
      console.log('response_dataが空です:', response.id)
      return []
    }

    const data = response.response_data

    console.log('問診票回答データを整形中:', {
      responseId: response.id,
      questionnaireId: response.questionnaire_id,
      dataKeys: Object.keys(data),
      dataKeysCount: Object.keys(data).length
    })

    // 問診票の定義を取得
    const questionDefinitions = questionnaireDefinitions.get(response.questionnaire_id)
    console.log('問診票定義:', {
      questionnaireId: response.questionnaire_id,
      hasDefinitions: !!questionDefinitions,
      definitionsCount: questionDefinitions?.size || 0
    })

    // 質問定義を配列に変換してsort_orderでソート
    const sortedQuestions: any[] = []
    if (questionDefinitions) {
      questionDefinitions.forEach((questionDef, questionId) => {
        sortedQuestions.push({ ...questionDef, id: questionId })
      })
      sortedQuestions.sort((a, b) => a.sort_order - b.sort_order)
    }

    console.log('ソート済み質問:', sortedQuestions.map(q => ({
      id: q.id,
      text: q.question_text,
      sort_order: q.sort_order
    })))

    // ソートされた質問順序に従って回答を整形
    const formattedDataArray: Array<{
      questionId: string
      questionText: string
      sectionName: string
      answer: any
      sortOrder: number
      linkedField?: string
    }> = []

    sortedQuestions.forEach((questionDef) => {
      const questionId = questionDef.id
      const answer = data[questionId]

      // 回答がある場合のみ追加
      if (answer !== undefined && answer !== null && answer !== '') {
        const questionText = questionDef.question_text
        const sectionName = questionDef.section_name || ''
        const linkedField = questionDef.linked_field

        // 回答を整形
        let formattedAnswer = answer

        // 配列の場合はカンマ区切りで表示
        if (Array.isArray(answer)) {
          formattedAnswer = answer.join(', ')
        }

        formattedDataArray.push({
          questionId,
          questionText,
          sectionName,
          answer: formattedAnswer || '（未回答）',
          sortOrder: questionDef.sort_order,
          linkedField
        })
      }
    })

    console.log('整形後のデータ:', {
      responseId: response.id,
      formattedDataCount: formattedDataArray.length,
      formattedData: formattedDataArray
    })

    return formattedDataArray
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">問診票回答を読み込み中...</div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={loadQuestionnaireResponses} className="mt-4">
            再読み込み
          </Button>
        </div>
      )
    }

    if (questionnaireResponses.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">問診票回答がありません</h3>
          <p className="text-gray-500 mb-4">
            この患者に連携された問診票回答が見つかりませんでした。
            <br />
            患者登録時に問診票が自動連携されます。
          </p>
          <div className="text-xs text-gray-400 mb-4">
            患者ID: {patientId}
          </div>
          <Button
            onClick={loadQuestionnaireResponses}
            variant="outline"
            size="sm"
          >
            再読み込み
          </Button>
        </div>
      )
    }

    // 習慣チェック表の場合は口腔機能評価パネルも表示
    const habitResponses = questionnaireResponses.filter(
      r => {
        const name = r.questionnaire?.name || ''
        return name.includes('習慣チェック表')
      }
    )

    // activeTypeに応じて表示する問診票をフィルタリング
    const displayResponses = activeType === 'habit'
      ? habitResponses
      : questionnaireResponses.filter(r => {
          const name = r.questionnaire?.name || ''
          return !name.includes('習慣チェック表')
        })

    return (
      <div className="space-y-4">
        {/* 習慣チェック表タブの場合、口腔機能評価パネルを先に表示 */}
        {activeType === 'habit' && habitResponses.length > 0 && (
          <OralFunctionAssessmentPanel patientId={patientId} />
        )}

        {displayResponses.map((response) => {
          const formattedData = formatResponseData(response)
          const isExpanded = expandedResponses.has(response.id)

          // 問診票の名前を取得
          const questionnaireName = response.questionnaire?.name || '問診票回答'

          return (
            <Card key={response.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => toggleExpanded(response.id)}
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-base">
                          {questionnaireName}
                        </CardTitle>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(response.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                        </div>
                        {response.patient_name && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {response.patient_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={response.patient_id ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {response.patient_id ? '連携済み' : '未連携'}
                    </Badge>
                    {response.patient_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkResponse(response.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="連携解除"
                      >
                        <Unlink className="w-4 h-4 mr-1" />
                        <span className="text-xs">連携解除</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* セクションごとにグループ化（質問順序を保持） */}
                  {(() => {
                    // セクション名でグループ化しつつ、順序を保持
                    const sections = new Map<string, Array<{
                      questionText: string
                      sectionName: string
                      answer: any
                      sortOrder: number
                      linkedField?: string
                    }>>()

                    formattedData.forEach((item) => {
                      const sectionName = item.sectionName || 'その他'
                      if (!sections.has(sectionName)) {
                        sections.set(sectionName, [])
                      }
                      sections.get(sectionName)!.push({
                        questionText: item.questionText,
                        sectionName: item.sectionName,
                        answer: item.answer,
                        sortOrder: item.sortOrder,
                        linkedField: item.linkedField
                      })
                    })

                    // セクション内でsort_orderでソート（既にソート済みだが念のため）
                    sections.forEach((questions, sectionName) => {
                      questions.sort((a, b) => a.sortOrder - b.sortOrder)
                    })

                    // セクションを最初の質問のsort_orderでソート
                    const sortedSections = Array.from(sections.entries()).sort((a, b) => {
                      const aFirstOrder = a[1][0]?.sortOrder || 0
                      const bFirstOrder = b[1][0]?.sortOrder || 0
                      return aFirstOrder - bFirstOrder
                    })

                    return sortedSections.map(([sectionName, questions]) => (
                      <div key={sectionName} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="text-base font-semibold text-gray-900 mb-3">
                          {sectionName}
                        </h4>
                        <div className="space-y-3">
                          {questions.map((item, index) => {
                            return (
                              <div key={index} className="bg-white">
                                <dt className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2 flex-wrap">
                                  <span>{item.questionText}</span>
                                  {item.linkedField && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      {patientFieldLabels[item.linkedField] || item.linkedField}と連携
                                    </Badge>
                                  )}
                                </dt>
                                <dd className="text-sm text-gray-900 pl-4 py-2 bg-gray-50 rounded border-l-2 border-gray-300">
                                  {typeof item.answer === 'string' ? item.answer : JSON.stringify(item.answer, null, 2)}
                                </dd>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  })()}

                  {response.patient_id && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">
                          この問診票は患者情報と連携されています
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* サブタブナビゲーション */}
      <div className="flex items-center space-x-4 border-b border-gray-200">
        <button
          onClick={() => handleTypeChange('display')}
          className={`
            flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap
            ${activeType === 'display'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          <FileText className="w-4 h-4" />
          <span>表示問診票</span>
        </button>
        <button
          onClick={() => handleTypeChange('habit')}
          className={`
            flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap
            ${activeType === 'habit'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          <ClipboardList className="w-4 h-4" />
          <span>習慣チェック表</span>
        </button>
      </div>

      {/* タブの説明とバッジ */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {activeType === 'display' ? '表示問診票' : '習慣チェック表'}
        </h3>
        <Badge variant="outline" className="text-sm">
          {activeType === 'habit'
            ? questionnaireResponses.filter(r => {
                const name = r.questionnaire?.name || ''
                return name.includes('習慣チェック表')
              }).length
            : questionnaireResponses.filter(r => {
                const name = r.questionnaire?.name || ''
                return !name.includes('習慣チェック表')
              }).length
          }件の回答
        </Badge>
      </div>

      {/* コンテンツ表示 */}
      {renderContent()}
    </div>
  )
}
