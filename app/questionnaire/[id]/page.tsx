'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { getQuestionnaires, type Questionnaire } from '@/lib/api/questionnaires'
import { QuestionnaireForm } from '@/components/forms/questionnaire-form'
import { CheckCircle } from 'lucide-react'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function QuestionnaireDetailPage() {
  const params = useParams()
  const questionnaireId = params.id as string

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [loading, setLoading] = useState(true)
  const [showThankYouMessage, setShowThankYouMessage] = useState(false)
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null)

  // 問診票データの読み込み
  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setLoading(true)
        const data = await getQuestionnaires(DEMO_CLINIC_ID)
        const targetQuestionnaire = data.find(q => q.id === questionnaireId && q.is_active)

        if (targetQuestionnaire) {
          setQuestionnaire(targetQuestionnaire)
        }
      } catch (error) {
        console.error('問診票データの読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    if (questionnaireId) {
      loadQuestionnaire()
    }
  }, [questionnaireId])

  const handleSubmit = (responseId: string) => {
    setSubmittedResponseId(responseId)
    setShowThankYouMessage(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="text-lg">問診票を読み込み中...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="text-lg font-medium text-gray-900 mb-2">
                問診票が見つかりません
              </div>
              <p className="text-sm">
                指定された問診票は存在しないか、現在無効になっています。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {showThankYouMessage ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    送信完了
                  </h2>
                  <p className="text-lg text-gray-600">
                    問診票のご回答ありがとうございました
                  </p>
                </div>
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">
                    回答ID: {submittedResponseId}
                  </p>
                  <p className="text-sm text-gray-600">
                    このページは閉じて頂いて構いません
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {questionnaire.name}
                </h1>
                {questionnaire.description && (
                  <p className="text-gray-600">{questionnaire.description}</p>
                )}
              </div>

              <QuestionnaireForm
                clinicId={DEMO_CLINIC_ID}
                questionnaireId={questionnaire.id}
                onCancel={() => {}}
                onSave={handleSubmit}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
