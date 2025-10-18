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
  Eye,
  EyeOff,
  ClipboardList
} from 'lucide-react'
import { getLinkedQuestionnaireResponses, QuestionnaireResponse, getQuestionnaires } from '@/lib/api/questionnaires'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface QuestionnaireTabProps {
  patientId: string
}

type QuestionnaireType = 'display' | 'habit'

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
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)
  const [questionnaireDefinitions, setQuestionnaireDefinitions] = useState<Map<string, any>>(new Map())

  // URLパラメータが変更されたら activeType を更新
  useEffect(() => {
    setActiveType(questionnaireType)
  }, [questionnaireType])

  useEffect(() => {
    loadQuestionnaireResponses()
  }, [patientId, activeType])

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

      // この患者に連携済みの問診票回答を取得
      const patientResponses = await getLinkedQuestionnaireResponses(patientId)

      // 問診票の定義を取得（質問IDから質問文を取得するため）
      // 仮のclinicIdを使用（実際の実装では適切なclinicIdを使用）
      const questionnaires = await getQuestionnaires('11111111-1111-1111-1111-111111111111')

      // 問診票IDをキーとして質問のマップを作成
      const questionMap = new Map()
      questionnaires.forEach(q => {
        const qMap = new Map()
        q.questions.forEach((question: any) => {
          qMap.set(question.id, question)
        })
        questionMap.set(q.id, qMap)
      })
      setQuestionnaireDefinitions(questionMap)

      setQuestionnaireResponses(patientResponses)

      // 最初の問診票をデフォルトで展開
      if (patientResponses.length > 0 && !expandedResponse) {
        setExpandedResponse(patientResponses[0].id)
      }
    } catch (err) {
      console.error('問診票回答の読み込みエラー:', err)
      setError('問診票回答の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (responseId: string) => {
    setExpandedResponse(expandedResponse === responseId ? null : responseId)
  }

  const formatResponseData = (response: QuestionnaireResponse) => {
    if (!response.response_data) return {}

    const data = response.response_data
    const formattedData: { [key: string]: any } = {}

    // 問診票の定義を取得
    const questionDefinitions = questionnaireDefinitions.get(response.questionnaire_id)

    // 全ての回答をループして、質問文と回答をペアにする
    Object.entries(data).forEach(([questionId, answer]) => {
      // メタデータ（patient_name等）はスキップ
      if (!questionId.startsWith('q')) return

      // 質問定義を取得
      const questionDef = questionDefinitions?.get(questionId)

      if (questionDef) {
        const questionText = questionDef.question_text
        const sectionName = questionDef.section_name

        // 回答を整形
        let formattedAnswer = answer

        // 配列の場合はカンマ区切りで表示
        if (Array.isArray(answer)) {
          formattedAnswer = answer.join(', ')
        }

        // セクション名付きでキーを作成
        const key = sectionName ? `【${sectionName}】${questionText}` : questionText
        formattedData[key] = formattedAnswer || '（未回答）'
      } else {
        // 定義が見つからない場合はそのまま表示
        formattedData[questionId] = answer
      }
    })

    return formattedData
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
          <p className="text-gray-500 mb-4">この患者に関連する問診票回答が見つかりませんでした。</p>
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

    return (
      <div className="space-y-4">
        {questionnaireResponses.map((response) => {
          const isExpanded = expandedResponse === response.id
          const formattedData = formatResponseData(response)

          return (
            <Card key={response.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base">
                        問診票回答
                      </CardTitle>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(response.id)}
                      className="p-1"
                    >
                      {isExpanded ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {/* セクションごとにグループ化 */}
                    {(() => {
                      const sections = new Map<string, Array<[string, any]>>()

                      // セクションごとに質問をグループ化
                      Object.entries(formattedData).forEach(([key, value]) => {
                        const match = key.match(/^【(.+?)】(.+)$/)
                        if (match) {
                          const [, sectionName, questionText] = match
                          if (!sections.has(sectionName)) {
                            sections.set(sectionName, [])
                          }
                          sections.get(sectionName)!.push([questionText, value])
                        } else {
                          if (!sections.has('その他')) {
                            sections.set('その他', [])
                          }
                          sections.get('その他')!.push([key, value])
                        }
                      })

                      return Array.from(sections.entries()).map(([sectionName, questions]) => (
                        <div key={sectionName} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="text-base font-semibold text-gray-900 mb-3">
                            {sectionName}
                          </h4>
                          <div className="space-y-3">
                            {questions.map(([questionText, answer], index) => (
                              <div key={index} className="bg-white">
                                <dt className="text-sm font-medium text-gray-700 mb-1">
                                  {questionText}
                                </dt>
                                <dd className="text-sm text-gray-900 pl-4 py-2 bg-gray-50 rounded border-l-2 border-gray-300">
                                  {typeof answer === 'string' ? answer : JSON.stringify(answer, null, 2)}
                                </dd>
                              </div>
                            ))}
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
          {questionnaireResponses.length}件の回答
        </Badge>
      </div>

      {/* コンテンツ表示 */}
      {renderContent()}
    </div>
  )
}
