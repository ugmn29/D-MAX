'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  Loader2,
  CalendarCheck,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Users,
  RefreshCw,
  Phone
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

declare global {
  interface Window {
    liff: any
  }
}

interface Appointment {
  id: string
  patient: {
    id: string
    name: string
    patient_number: number
  }
  appointment_date: string
  appointment_time: string
  duration: number
  status: string
  treatment_type?: string
  notes?: string
  staff?: {
    id: string
    name: string
  }
  cancellation_reason?: string
  cancelled_at?: string
  // 予約変更用に元の診療メニューと担当者IDを保持
  menu1_id?: string | null
  menu2_id?: string | null
  staff_id?: string | null
}

interface WebBookingSettings {
  can_cancel: boolean
  can_reschedule: boolean
  cancel_block_reason: string | null
  reschedule_block_reason: string | null
  cancel_count_this_month: number
  cancel_limit: number | null
  cancel_deadline_hours: number | null
}

interface PatientAppointments {
  patient: {
    id: string
    name: string
    patient_number: number
  }
  appointments: Appointment[]
  count: number
  web_booking_settings?: WebBookingSettings
}

export default function AppointmentsPage() {
  const [liffReady, setLiffReady] = useState(false)
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [patientAppointments, setPatientAppointments] = useState<PatientAppointments[]>([])
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // キャンセル関連
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  // 予約変更関連
  const [showChangeDialog, setShowChangeDialog] = useState(false)
  const [changing, setChanging] = useState(false)

  // クリニック電話番号
  const [clinicPhone, setClinicPhone] = useState<string | null>(null)

  // LIFF初期化
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // LIFF SDK待機（50msごとにチェック、10秒でタイムアウト）
        const liffLoaded = await new Promise<boolean>((resolve) => {
          if (typeof window !== 'undefined' && window.liff) {
            resolve(true)
            return
          }
          const checkLiff = setInterval(() => {
            if (typeof window !== 'undefined' && window.liff) {
              clearInterval(checkLiff)
              resolve(true)
            }
          }, 50)
          setTimeout(() => {
            clearInterval(checkLiff)
            resolve(false)
          }, 10000)
        })

        if (!liffLoaded) {
          setError('LIFF SDKの読み込みに失敗しました')
          setLiffReady(true) // エラー画面を表示するためにtrueにする
          setLoading(false)
          return
        }

        // LIFF ID取得
        let liffId = process.env.NEXT_PUBLIC_LIFF_ID_APPOINTMENTS
        if (!liffId) {
          try {
            const response = await fetch('/api/liff-settings')
            if (response.ok) {
              const data = await response.json()
              liffId = data.appointments || null
            }
          } catch (e) {
            console.warn('API LIFF ID取得エラー:', e)
          }
        }

        if (!liffId) {
          setError('LIFF IDが設定されていません')
          setLiffReady(true) // エラー画面を表示するためにtrueにする
          setLoading(false)
          return
        }

        await window.liff.init({ liffId })

        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile()
          setLineUserId(profile.userId)
          setLiffReady(true)
          loadAppointments(profile.userId)
        } else {
          window.liff.login()
        }
      } catch (err: any) {
        console.error('LIFF初期化エラー:', err)
        const errorMessage = err?.message || err?.toString() || '不明なエラー'
        setError(`初期化に失敗しました: ${errorMessage}`)
        setLiffReady(true) // エラー画面を表示するためにtrueにする
        setLoading(false)
      }
    }

    initializeLiff()
  }, [])

  // 予約一覧を読み込み
  const loadAppointments = async (userId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/line/appointments?line_user_id=${userId}`)
      const data = await response.json()

      console.log('📅 予約API応答:', data)

      if (response.ok) {
        setPatientAppointments(data.appointments_by_patient || [])
        setDebugInfo(data.debug || null)
        setClinicPhone(data.clinic_phone || null)

        if (data.appointments_by_patient.length === 0) {
          // 連携患者がいるが予約がない場合と、連携患者自体がいない場合を区別
          if (data.patient_count === 0) {
            setError('LINE連携されている患者がいません')
          } else if (data.total_count === 0) {
            setError(`${data.patient_count}名の連携患者がいますが、今日以降の予約はありません`)
          } else {
            setError('予約がありません')
          }
        }
      } else {
        // エラー時もデバッグ情報があれば設定
        setDebugInfo(data.debug || { error_details: data.details, error_code: data.code })
        setError(`${data.error || '予約情報の取得に失敗しました'}${data.details ? ` (${data.details})` : ''}`)
      }
    } catch (err) {
      console.error('予約読み込みエラー:', err)
      setError('予約情報の読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 予約キャンセル
  const handleCancelAppointment = async () => {
    if (!lineUserId || !selectedAppointment) return

    setCancelling(true)
    setError(null)

    try {
      const response = await fetch('/api/line/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: selectedAppointment.id,
          line_user_id: lineUserId,
          cancellation_reason: cancellationReason || 'LINE経由でキャンセル'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCancelSuccess(true)

        // 予約一覧を再読み込み
        setTimeout(async () => {
          await loadAppointments(lineUserId)
          setShowCancelDialog(false)
          setCancelSuccess(false)
          setSelectedAppointment(null)
          setCancellationReason('')
        }, 2000)
      } else {
        setError(data.error || 'キャンセルに失敗しました')
      }
    } catch (err) {
      console.error('キャンセルエラー:', err)
      setError('キャンセル処理中にエラーが発生しました')
    } finally {
      setCancelling(false)
    }
  }

  // 予約変更（キャンセル後にWeb予約ページへ遷移）
  const handleChangeAppointment = async () => {
    if (!lineUserId || !selectedAppointment) return

    setChanging(true)
    setError(null)

    try {
      // まず現在の予約をキャンセル
      const response = await fetch('/api/line/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: selectedAppointment.id,
          line_user_id: lineUserId,
          cancellation_reason: '予約変更のためキャンセル'
        })
      })

      const data = await response.json()

      if (response.ok) {
        // キャンセル成功 → Web予約ページへ遷移
        // 患者情報を取得してURLパラメータに含める
        const patient = selectedAppointment.patient

        // 予約変更用URLパラメータを構築（元の診療メニューと担当者を引き継ぐ）
        const params = new URLSearchParams({
          from_line: 'true',
          patient_id: patient.id,
          patient_number: String(patient.patient_number),
          reschedule: 'true',
          duration: String(selectedAppointment.duration)
        })

        // 元の診療メニューIDを追加（設定されている場合）
        if (selectedAppointment.menu1_id) {
          params.set('menu1_id', selectedAppointment.menu1_id)
        }
        if (selectedAppointment.menu2_id) {
          params.set('menu2_id', selectedAppointment.menu2_id)
        }
        // 元の担当者IDを追加（設定されている場合）
        if (selectedAppointment.staff_id) {
          params.set('staff_id', selectedAppointment.staff_id)
        }

        const bookingUrl = `/web-booking?${params.toString()}`

        // LIFFブラウザで外部URLを開く
        if (window.liff && window.liff.isInClient()) {
          window.liff.openWindow({
            url: window.location.origin + bookingUrl,
            external: false
          })
        } else {
          window.location.href = bookingUrl
        }
      } else {
        setError(data.error || '予約の変更に失敗しました')
        setShowChangeDialog(false)
      }
    } catch (err) {
      console.error('予約変更エラー:', err)
      setError('予約変更処理中にエラーが発生しました')
      setShowChangeDialog(false)
    } finally {
      setChanging(false)
    }
  }

  // 予約ステータスの表示
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: '予約済み', className: 'bg-blue-100 text-blue-800' },
      confirmed: { label: '確定', className: 'bg-green-100 text-green-800' },
      completed: { label: '完了', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'キャンセル', className: 'bg-red-100 text-red-800' },
      no_show: { label: '無断キャンセル', className: 'bg-orange-100 text-orange-800' }
    }

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return `${date.getMonth() + 1}月${date.getDate()}日(${days[date.getDay()]})`
  }

  // 時刻フォーマット
  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5) // HH:MM
  }

  // LIFF読み込み中
  if (!liffReady || loading) {
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

  // 予約がない場合
  if (patientAppointments.length === 0 || !patientAppointments[selectedPatientIndex]) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">予約がありません</h2>
              <p className="text-gray-600 text-sm">
                {error || '現在、予約は登録されていません'}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                LINE ID: {lineUserId || '取得中...'}
              </p>
              {debugInfo && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs overflow-auto max-h-60">
                  <p className="font-bold mb-1">デバッグ情報:</p>
                  <p>今日の日付: {debugInfo.today_date}</p>
                  <p>連携患者ID: {debugInfo.linkage_patient_ids?.join(', ') || 'なし'}</p>
                  <p>予約件数(raw): {debugInfo.raw_appointments_count}</p>
                  <p className="mt-2 font-bold">全未来予約の患者ID:</p>
                  <p className="break-all">{debugInfo.all_future_appointment_patient_ids?.join(', ') || 'なし'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentPatientData = patientAppointments[selectedPatientIndex]
  // キャンセル済みは表示、完了済み（遅刻等）は非表示
  const hiddenStatuses = ['completed', '終了', '会計', '来院']
  const displayAppointments = currentPatientData.appointments.filter(
    apt => !hiddenStatuses.includes(apt.status)
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      <div className="container mx-auto max-w-2xl p-4 py-6">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">予約確認</h1>
          <p className="text-gray-600 text-sm">ご予約の確認・キャンセルができます</p>
        </div>

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 患者切り替え（複数患者の場合） */}
        {patientAppointments.length > 1 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatientIndex(Math.max(0, selectedPatientIndex - 1))}
                  disabled={selectedPatientIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {currentPatientData.patient.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    患者番号: {currentPatientData.patient.patient_number}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {selectedPatientIndex + 1} / {patientAppointments.length}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatientIndex(Math.min(patientAppointments.length - 1, selectedPatientIndex + 1))}
                  disabled={selectedPatientIndex === patientAppointments.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 予約一覧 */}
        <div className="space-y-4">
          {displayAppointments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">予約がありません</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            displayAppointments.map((appointment) => {
              // キャンセル済みかどうか判定
              const isCancelled = ['cancelled', 'キャンセル', 'キャンセル（様々）'].includes(appointment.status)

              return (
                <Card
                  key={appointment.id}
                  className={`hover:shadow-md transition-shadow ${isCancelled ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className={`w-4 h-4 ${isCancelled ? 'text-gray-400' : 'text-blue-600'}`} />
                          <span className={`font-semibold ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {formatDate(appointment.appointment_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className={isCancelled ? 'line-through' : ''}>{formatTime(appointment.appointment_time)}</span>
                          <span className="text-sm text-gray-500">
                            ({appointment.duration}分)
                          </span>
                        </div>
                      </div>
                      <div>{getStatusBadge(appointment.status)}</div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* 治療内容 */}
                    {appointment.treatment_type && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 min-w-[60px]">治療内容:</span>
                        <span className="text-gray-900">{appointment.treatment_type}</span>
                      </div>
                    )}

                    {/* 担当医 */}
                    {appointment.staff && (
                      <div className="flex items-start gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-500 min-w-[60px]">担当医:</span>
                        <span className="text-gray-900">{appointment.staff.name}</span>
                      </div>
                    )}

                    {/* 備考 */}
                    {appointment.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 min-w-[60px]">備考:</span>
                        <span className="text-gray-700">{appointment.notes}</span>
                      </div>
                    )}

                    {/* 変更・キャンセルボタン（キャンセル済みでなければ表示） */}
                    {!isCancelled && (
                      <div className="pt-2 border-t space-y-2">
                        {/* Web予約設定の制限情報を表示 */}
                        {currentPatientData?.web_booking_settings && (
                          !currentPatientData.web_booking_settings.can_cancel ||
                          !currentPatientData.web_booking_settings.can_reschedule
                        ) && (
                          <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded space-y-2">
                            <p>
                              {currentPatientData.web_booking_settings.cancel_block_reason ||
                               currentPatientData.web_booking_settings.reschedule_block_reason}
                            </p>
                            {clinicPhone && (
                              <a
                                href={`tel:${clinicPhone}`}
                                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                              >
                                <Phone className="w-4 h-4" />
                                医院に電話する
                              </a>
                            )}
                          </div>
                        )}

                        {/* 予約変更ボタン */}
                        {currentPatientData?.web_booking_settings?.can_reschedule !== false ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              // 予約変更：現在の予約をキャンセルしてWeb予約ページへ
                              setSelectedAppointment(appointment)
                              setShowChangeDialog(true)
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            予約を変更する
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-gray-400 cursor-not-allowed"
                            disabled
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            予約変更不可（お電話ください）
                          </Button>
                        )}

                        {/* キャンセルボタン */}
                        {currentPatientData?.web_booking_settings?.can_cancel !== false ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedAppointment(appointment)
                              setShowCancelDialog(true)
                            }}
                          >
                            <CalendarX className="w-4 h-4 mr-2" />
                            この予約をキャンセル
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-gray-400 cursor-not-allowed"
                            disabled
                          >
                            <CalendarX className="w-4 h-4 mr-2" />
                            キャンセル不可（お電話ください）
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* 注意事項 */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-medium">キャンセルについて</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>予約当日のキャンセルはお電話でお願いします</li>
                  <li>キャンセル後の再予約は改めてご連絡ください</li>
                  <li>無断キャンセルが続く場合、次回予約をお断りする場合があります</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* キャンセル確認ダイアログ */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          {cancelSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">キャンセル完了</h2>
              <p className="text-gray-600 text-sm">予約をキャンセルしました</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  予約のキャンセル
                </DialogTitle>
                <DialogDescription>
                  以下の予約をキャンセルしますか？
                </DialogDescription>
              </DialogHeader>

              {selectedAppointment && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="font-medium text-gray-900">
                      {formatDate(selectedAppointment.appointment_date)} {formatTime(selectedAppointment.appointment_time)}
                    </div>
                    {selectedAppointment.treatment_type && (
                      <div className="text-sm text-gray-600">
                        {selectedAppointment.treatment_type}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancellation-reason">
                      キャンセル理由（任意）
                    </Label>
                    <Textarea
                      id="cancellation-reason"
                      placeholder="例: 体調不良のため"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      disabled={cancelling}
                      rows={3}
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      キャンセル後の再予約は改めてご連絡ください
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelDialog(false)
                    setSelectedAppointment(null)
                    setCancellationReason('')
                  }}
                  disabled={cancelling}
                >
                  戻る
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelAppointment}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      キャンセル中...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      キャンセルする
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 予約変更確認ダイアログ */}
      <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              予約の変更
            </DialogTitle>
            <DialogDescription>
              現在の予約をキャンセルして、新しい日時で予約し直します。
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-xs text-gray-500 mb-1">現在の予約</p>
                <div className="font-medium text-gray-900">
                  {formatDate(selectedAppointment.appointment_date)} {formatTime(selectedAppointment.appointment_time)}
                </div>
                {selectedAppointment.treatment_type && (
                  <div className="text-sm text-gray-600">
                    {selectedAppointment.treatment_type}
                  </div>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800">
                  「変更する」をタップすると、現在の予約がキャンセルされ、予約画面に移動します。
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeDialog(false)
                setSelectedAppointment(null)
              }}
              disabled={changing}
            >
              戻る
            </Button>
            <Button
              onClick={handleChangeAppointment}
              disabled={changing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {changing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  変更する
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
