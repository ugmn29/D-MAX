'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  QrCode,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    liff: any
  }
}

interface Patient {
  id: string
  name: string
  patient_number: number
}

interface QRData {
  token: string
  created_at: string
  last_used_at: string | null
  usage_count: number
}

export default function QRCodePage() {
  const [liffReady, setLiffReady] = useState(false)
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(false)
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
          return
        }

        let liffId = process.env.NEXT_PUBLIC_LIFF_ID_QR_CODE

        // localStorageから設定画面の値を取得
        try {
          const savedSettings = localStorage.getItem('notificationSettings')
          if (savedSettings) {
            const settings = JSON.parse(savedSettings)
            if (settings.line?.liff_id_qr_code) {
              liffId = settings.line.liff_id_qr_code
            }
          }
        } catch (e) {
          console.warn('localStorage読み込みエラー:', e)
        }

        if (!liffId) {
          setError('LIFF IDが設定されていません')
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
      }
    }

    initializeLiff()
  }, [])

  // URLパラメータから patient_id を取得
  useEffect(() => {
    if (liffReady) {
      const params = new URLSearchParams(window.location.search)
      const patientId = params.get('patient_id')
      if (patientId) {
        setSelectedPatientId(patientId)
        loadQRCode(patientId)
      }
    }
  }, [liffReady])

  // 連携患者一覧を読み込み
  const loadPatients = async (userId: string) => {
    try {
      const response = await fetch(`/api/line/link-patient?line_user_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const patientList = data.linkages.map((linkage: any) => ({
          id: linkage.patient_id,
          name: `${linkage.patients.last_name} ${linkage.patients.first_name}`,
          patient_number: linkage.patients.patient_number
        }))
        setPatients(patientList)

        // 1人だけの場合は自動選択
        if (patientList.length === 1 && !selectedPatientId) {
          setSelectedPatientId(patientList[0].id)
          await loadQRCode(patientList[0].id)
        }
      }
    } catch (err) {
      console.error('患者一覧読み込みエラー:', err)
    }
  }

  // QRコードを読み込み
  const loadQRCode = async (patientId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/patients/${patientId}/qr-code`)
      const data = await response.json()

      if (response.ok) {
        setQrCodeImage(data.qr_code)
        setQrData(data.qr_data)
      } else {
        setError(data.error || 'QRコードの取得に失敗しました')
      }
    } catch (err) {
      console.error('QRコード読み込みエラー:', err)
      setError('QRコードの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // QRコードをダウンロード
  const downloadQRCode = () => {
    if (!qrCodeImage) return

    const link = document.createElement('a')
    link.href = qrCodeImage
    link.download = `qr-code-${selectedPatientId}.png`
    link.click()
  }

  // QRコードを更新
  const refreshQRCode = () => {
    if (selectedPatientId) {
      loadQRCode(selectedPatientId)
    }
  }

  // LIFF読み込み中
  if (!liffReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-600">読み込み中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 未連携
  if (patients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">未連携</h2>
              <p className="text-gray-600">
                まだ患者登録が完了していません。<br />
                リッチメニューの「初回登録」から<br />
                連携を完了してください。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto max-w-md p-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            受付用QRコード
          </h1>
          <p className="text-gray-600 text-sm">
            受付でこのQRコードを提示してください
          </p>
        </div>

        {/* 患者選択（複数連携の場合） */}
        {patients.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                患者を選択
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatientId(patient.id)
                      loadQRCode(patient.id)
                    }}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedPatientId === patient.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-500">
                      患者番号: {patient.patient_number}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* QRコード表示 */}
        {selectedPatient && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedPatient.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    患者番号: {selectedPatient.patient_number}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshQRCode}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600">QRコード生成中...</p>
                </div>
              ) : qrCodeImage ? (
                <div className="space-y-4">
                  {/* QRコード画像 */}
                  <div className="bg-white p-8 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                    <img
                      src={qrCodeImage}
                      alt="QRコード"
                      className="w-full max-w-[250px]"
                    />
                  </div>

                  {/* 使用情報 */}
                  {qrData && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">使用回数</span>
                        <span className="font-medium text-gray-900">
                          {qrData.usage_count}回
                        </span>
                      </div>
                      {qrData.last_used_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">最終使用</span>
                          <span className="text-gray-900">
                            {new Date(qrData.last_used_at).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ダウンロードボタン */}
                  <Button
                    onClick={downloadQRCode}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    QRコードを保存
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* 案内 */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-medium">受付での使い方</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>受付でこのQRコードを提示</li>
                  <li>スタッフがQRコードを読み取り</li>
                  <li>受付完了</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
