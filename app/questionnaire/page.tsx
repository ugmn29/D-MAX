'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getQuestionnaires, type Questionnaire } from '@/lib/api/questionnaires'
import { QuestionnaireForm } from '@/components/forms/questionnaire-form'
import { FileText, CheckCircle, Link2, Check } from 'lucide-react'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function QuestionnairePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const questionnaireId = searchParams.get('id')

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null)
  const [showThankYouMessage, setShowThankYouMessage] = useState(false)
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 問診票データの読み込み
  useEffect(() => {
    const loadQuestionnaires = async () => {
      try {
        setLoading(true)
        const data = await getQuestionnaires(DEMO_CLINIC_ID)
        // 有効な問診票のみを表示
        const activeQuestionnaires = data.filter(q => q.is_active)
        setQuestionnaires(activeQuestionnaires)

        // URLパラメータから問診票IDが指定されている場合は自動選択
        if (questionnaireId && activeQuestionnaires.length > 0) {
          const questionnaire = activeQuestionnaires.find(q => q.id === questionnaireId)
          if (questionnaire) {
            setSelectedQuestionnaire(questionnaire)
          }
        } else if (activeQuestionnaires.length === 1) {
          // 問診票が1つしかない場合は自動選択
          setSelectedQuestionnaire(activeQuestionnaires[0])
        }
      } catch (error) {
        console.error('問診票データの読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQuestionnaires()
  }, [questionnaireId])

  // 質問数をカウント
  const getQuestionCount = (questionnaire: Questionnaire) => {
    return questionnaire.questions?.length || 0
  }

  // 問診票を選択してURLを更新
  const selectQuestionnaire = (questionnaire: Questionnaire) => {
    router.push(`/questionnaire?id=${questionnaire.id}`)
    setSelectedQuestionnaire(questionnaire)
  }

  // 問診票一覧に戻る
  const backToList = () => {
    router.push('/questionnaire')
    setSelectedQuestionnaire(null)
  }

  // リンクをクリップボードにコピー
  const copyLink = async (questionnaireId: string, e: React.MouseEvent) => {
    e.stopPropagation() // カードのクリックイベントを防ぐ
    const url = `${window.location.origin}/questionnaire?id=${questionnaireId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(questionnaireId)
      setTimeout(() => setCopiedId(null), 2000) // 2秒後にアイコンを戻す
    } catch (err) {
      console.error('クリップボードへのコピーに失敗:', err)
      alert('リンクのコピーに失敗しました')
    }
  }

  // 感謝メッセージの表示
  if (showThankYouMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">ご協力ありがとうございました</h1>
                <p className="text-gray-600">
                  問診票の送信が完了いたしました。<br />
                  医療機関にて内容を確認いたします。
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">次のステップ</h3>
                  <p className="text-sm text-blue-700">
                    医療機関のスタッフが問診票の内容を確認し、<br />
                    必要に応じてご連絡いたします。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">問診票を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (questionnaires.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">問診票がありません</h1>
          <p className="text-gray-600">現在利用可能な問診票がありません</p>
        </div>
      </div>
    )
  }

  if (selectedQuestionnaire) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* ヘッダー */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedQuestionnaire.name}
                </h1>
                {selectedQuestionnaire.description && (
                  <p className="text-gray-600">{selectedQuestionnaire.description}</p>
                )}
                <div className="flex items-center mt-4 space-x-4">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    有効
                  </Badge>
                  <span className="text-sm text-gray-500">
                    質問数: {getQuestionCount(selectedQuestionnaire)}件
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={backToList}
              >
                問診票一覧に戻る
              </Button>
            </div>
          </div>

          {/* 問診票フォーム */}
          <QuestionnaireForm
            clinicId={DEMO_CLINIC_ID}
            questionnaireId={selectedQuestionnaire.id}
            onSave={(responseId) => {
              console.log('問診票ページ: onSaveコールバック受信:', responseId)
              setSubmittedResponseId(responseId)
              setShowThankYouMessage(true)
              console.log('問診票ページ: 感謝メッセージ表示状態を更新')
            }}
            onCancel={backToList}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">問診票</h1>
          <p className="text-gray-600">ご利用いただける問診票を選択してください</p>
        </div>

        {/* 問診票一覧 */}
        <div className="grid gap-6">
          {questionnaires.map((questionnaire) => (
            <Card
              key={questionnaire.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => selectQuestionnaire(questionnaire)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 mr-3">
                        {questionnaire.name}
                      </h3>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        有効
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => copyLink(questionnaire.id, e)}
                        className="ml-2 p-2 h-8 w-8"
                        title="リンクをコピー"
                      >
                        {copiedId === questionnaire.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Link2 className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                        )}
                      </Button>
                    </div>
                    {questionnaire.description && (
                      <p className="text-gray-600 mb-4">{questionnaire.description}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        質問数: {getQuestionCount(questionnaire)}件
                      </span>
                      <span>作成日: {new Date(questionnaire.created_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      問診票を開始
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* フッター */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>問診票の回答内容は医療機関で適切に管理されます</p>
        </div>
      </div>
    </div>
  )
}
