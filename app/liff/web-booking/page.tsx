'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  User,
  AlertCircle,
  Loader2,
  ChevronRight,
  Users,
  ExternalLink,
  CheckCircle2
} from 'lucide-react'

declare global {
  interface Window {
    liff: any
  }
}

interface Patient {
  id: string
  name: string
  patient_number: number
  birth_date: string
  phone: string
}

export default function WebBookingLiffPage() {
  const [liffReady, setLiffReady] = useState(false)
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // LIFF初期化
  useEffect(() => {
    const waitForLiffSdk = (): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.liff) {
          resolve()
        } else {
          const checkLiff = setInterval(() => {
            if (typeof window !== 'undefined' && window.liff) {
              clearInterval(checkLiff)
              resolve()
            }
          }, 100)
          // 10秒でタイムアウト
          setTimeout(() => {
            clearInterval(checkLiff)
            resolve()
          }, 10000)
        }
      })
    }

    const initializeLiff = async () => {
      try {
        await waitForLiffSdk()

        if (typeof window === 'undefined' || !window.liff) {
          setError('LIFF SDKの読み込みに失敗しました')
          setLoading(false)
          return
        }

        // APIからLIFF IDを取得
        let liffId: string | null = null
        try {
          const response = await fetch('/api/liff-settings')
          if (response.ok) {
            const data = await response.json()
            liffId = data.web_booking
          }
        } catch (e) {
          console.warn('API LIFF ID取得エラー:', e)
        }

        // フォールバック: 環境変数
        if (!liffId) {
          liffId = process.env.NEXT_PUBLIC_LIFF_ID_WEB_BOOKING || null
        }

        if (!liffId) {
          setError('LIFF IDが設定されていません')
          setLoading(false)
          return
        }

        await window.liff.init({ liffId })

        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile()
          setLineUserId(profile.userId)
          setLiffReady(true)
          await loadPatients(profile.userId)
        } else {
          window.liff.login()
        }
      } catch (err) {
        console.error('LIFF初期化エラー:', err)
        setError('初期化に失敗しました')
        setLoading(false)
      }
    }

    initializeLiff()
  }, [])

  // 連携患者を読み込み
  const loadPatients = async (userId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/line/link-patient?line_user_id=${userId}`)
      const data = await response.json()

      if (response.ok) {
        const patientList = data.linkages.map((linkage: any) => ({
          id: linkage.patient_id,
          name: `${linkage.patients.last_name} ${linkage.patients.first_name}`,
          patient_number: linkage.patients.patient_number,
          birth_date: linkage.patients.birth_date,
          phone: linkage.patients.phone
        }))

        setPatients(patientList)

        if (patientList.length === 0) {
          setError('LINE連携されている患者がいません。先に初回登録を完了してください。')
        } else if (patientList.length === 1) {
          // 1人しかいない場合は自動選択
          setSelectedPatient(patientList[0])
        }
      } else {
        setError(data.error || '患者情報の取得に失敗しました')
      }
    } catch (err) {
      console.error('患者読み込みエラー:', err)
      setError('患者情報の読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // Web予約ページを開く
  const openWebBooking = () => {
    if (!selectedPatient) return

    // Web予約ページのURLにパラメータを付けて開く
    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      patient_id: selectedPatient.id,
      patient_number: selectedPatient.patient_number.toString(),
      phone: selectedPatient.phone,
      birth_date: selectedPatient.birth_date,
      from_line: 'true'
    })

    const webBookingUrl = `${baseUrl}/web-booking?${params.toString()}`

    // LIFFブラウザ内で開く
    if (window.liff) {
      window.liff.openWindow({
        url: webBookingUrl,
        external: false
      })
    } else {
      // フォールバック
      window.open(webBookingUrl, '_blank')
    }
  }

  // LIFF読み込み中
  if (!liffReady || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              <p className="text-gray-600">読み込み中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // エラー画面
  if (error && patients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">エラー</h2>
              <p className="text-gray-600 text-sm">{error}</p>
              <p className="text-xs text-gray-400 mt-2">
                LINE ID: {lineUserId || '取得中...'}
              </p>
              <Button
                onClick={() => {
                  if (window.liff) {
                    window.liff.closeWindow()
                  }
                }}
                variant="outline"
              >
                閉じる
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // メイン画面
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto max-w-md p-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Web予約
          </h1>
          <p className="text-gray-600 text-sm">
            予約する患者を選択してください
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 患者選択 */}
        {!selectedPatient ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">患者を選択</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {patient.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          患者番号: {patient.patient_number}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 選択された患者 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">予約する患者</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">
                        {selectedPatient.name}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>患者番号: {selectedPatient.patient_number}</div>
                        <div>生年月日: {selectedPatient.birth_date}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 患者を変更 */}
                {patients.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                    className="w-full mt-3"
                  >
                    患者を変更
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Web予約を開くボタン */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Button
                  onClick={openWebBooking}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Web予約画面を開く
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* 案内 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700 space-y-2">
                    <p className="font-medium">ご案内</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>患者情報は自動的に入力されます</li>
                      <li>希望の日時と診療内容を選択してください</li>
                      <li>予約完了後、確認メールが送信されます</li>
                      <li>予約の確認・キャンセルは「予約確認」メニューから行えます</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
