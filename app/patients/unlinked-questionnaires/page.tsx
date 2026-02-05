'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import {
  getUnlinkedQuestionnaireResponses,
  linkQuestionnaireResponseToPatient,
  QuestionnaireResponse
} from '@/lib/api/questionnaires'
import { getPatients, createPatient } from '@/lib/api/patients'
import { Patient } from '@/types/database'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useClinicId } from '@/hooks/use-clinic-id'

export default function UnlinkedQuestionnairesPage() {
  const clinicId = useClinicId()
  const router = useRouter()
  const [unlinkedResponses, setUnlinkedResponses] = useState<QuestionnaireResponse[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkingResponseId, setLinkingResponseId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [responses, patientsData] = await Promise.all([
        getUnlinkedQuestionnaireResponses(clinicId),
        getPatients(clinicId)
      ])

      console.log('未連携問診票取得:', responses.length, '件')
      console.log('患者データ取得:', patientsData.length, '件')

      setUnlinkedResponses(responses)
      setPatients(patientsData)
    } catch (err) {
      console.error('データ読み込みエラー:', err)
      setError('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 問診票から患者情報を抽出
  const extractPatientInfo = (response: QuestionnaireResponse) => {
    const data = response.response_data || {}

    return {
      name: data.patient_name || '氏名未入力',
      phone: data.patient_phone || '電話番号未入力',
      email: data.patient_email || '',
      completedAt: response.completed_at
    }
  }

  // 新規患者として登録して連携
  const handleCreateNewPatientAndLink = async (responseId: string) => {
    try {
      setLinkingResponseId(responseId)

      const response = unlinkedResponses.find(r => r.id === responseId)
      if (!response) {
        throw new Error('問診票が見つかりません')
      }

      const patientInfo = extractPatientInfo(response)

      // 仮登録患者を作成
      const newPatient = await createPatient(clinicId, {
        last_name: patientInfo.name.split(' ')[0] || '姓',
        first_name: patientInfo.name.split(' ')[1] || '名',
        phone: patientInfo.phone,
        email: patientInfo.email || undefined,
        is_registered: false // 仮登録
      })

      console.log('新規患者作成成功:', newPatient.id)

      // 問診票を患者に連携
      await linkQuestionnaireResponseToPatient(responseId, newPatient.id)

      console.log('問診票連携成功')

      // データ再読み込み
      await loadData()

      // 患者詳細ページに遷移
      router.push(`/patients/${newPatient.id}`)
    } catch (err) {
      console.error('患者作成・連携エラー:', err)
      alert('患者の作成と問診票の連携に失敗しました')
    } finally {
      setLinkingResponseId(null)
    }
  }

  // 既存患者と連携
  const handleLinkToExistingPatient = async (responseId: string, patientId: string) => {
    try {
      setLinkingResponseId(responseId)

      await linkQuestionnaireResponseToPatient(responseId, patientId)

      console.log('問診票連携成功')

      // データ再読み込み
      await loadData()

      alert('問診票を患者に連携しました')
    } catch (err) {
      console.error('問診票連携エラー:', err)
      alert('問診票の連携に失敗しました')
    } finally {
      setLinkingResponseId(null)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/patients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                患者一覧に戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                未連携問診票
              </h1>
              <p className="text-gray-600">患者に連携されていない問診票の一覧</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {loading ? '...' : unlinkedResponses.length}件
          </Badge>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="mt-2"
            >
              再試行
            </Button>
          </div>
        )}

        {/* 説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                未連携問診票について
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Webから送信された問診票で、まだ患者カルテに連携されていないものです。<br />
                  「新規患者として登録」ボタンで仮登録患者を作成して問診票を連携できます。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 問診票一覧 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
          </div>
        ) : unlinkedResponses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                未連携の問診票はありません
              </h3>
              <p className="text-gray-600">
                すべての問診票が患者に連携されています
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {unlinkedResponses.map((response) => {
              const patientInfo = extractPatientInfo(response)
              const isLinking = linkingResponseId === response.id

              return (
                <Card key={response.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-4">
                          <FileText className="w-5 h-5 text-blue-600 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {response.questionnaire?.name || '問診票'}
                          </h3>
                          <Badge variant="secondary" className="ml-2">
                            未連携
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-2" />
                            <span className="font-medium mr-2">患者名:</span>
                            {patientInfo.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            <span className="font-medium mr-2">電話番号:</span>
                            {patientInfo.phone}
                          </div>
                          {patientInfo.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              <span className="font-medium mr-2">メール:</span>
                              {patientInfo.email}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span className="font-medium mr-2">送信日時:</span>
                            {format(new Date(patientInfo.completedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col space-y-2">
                        <Button
                          onClick={() => handleCreateNewPatientAndLink(response.id)}
                          disabled={isLinking}
                          className="whitespace-nowrap"
                        >
                          {isLinking ? (
                            <>処理中...</>
                          ) : (
                            <>
                              <LinkIcon className="w-4 h-4 mr-2" />
                              新規患者として登録
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
