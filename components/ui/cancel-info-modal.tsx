'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Calendar, Clock, User, Phone, FileText, ExternalLink } from 'lucide-react'
import { getCancelReasons } from '@/lib/api/cancel-reasons'
import { getAppointments } from '@/lib/api/appointments'

interface CancelInfoModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
}

export function CancelInfoModal({
  isOpen,
  onClose,
  appointment
}: CancelInfoModalProps) {
  const router = useRouter()
  const [cancelReason, setCancelReason] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [nextAppointment, setNextAppointment] = useState<any>(null)

  useEffect(() => {
    if (isOpen && appointment?.cancel_reason_id) {
      loadCancelReason()
    }
    if (isOpen && appointment?.patient_id) {
      loadNextAppointment()
    }
  }, [isOpen, appointment])

  const loadCancelReason = async () => {
    try {
      setLoading(true)
      const reasons = await getCancelReasons('11111111-1111-1111-1111-111111111111')
      const reason = reasons.find(r => r.id === appointment.cancel_reason_id)
      setCancelReason(reason)
    } catch (error) {
      console.error('キャンセル理由取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNextAppointment = async () => {
    try {
      const today = new Date()
      const futureDate = new Date(today)
      futureDate.setFullYear(futureDate.getFullYear() + 1) // 今日から1年後まで検索

      const todayStr = today.toISOString().split('T')[0]
      const futureDateStr = futureDate.toISOString().split('T')[0]

      const appointments = await getAppointments('11111111-1111-1111-1111-111111111111', todayStr, futureDateStr)

      // 現在の予約より未来で、キャンセルされていない予約を検索
      const futureAppointments = appointments.filter(apt =>
        apt.patient_id === appointment.patient_id &&
        apt.id !== appointment.id &&
        apt.status !== 'キャンセル' &&
        (apt.appointment_date > appointment.appointment_date ||
         (apt.appointment_date === appointment.appointment_date && apt.start_time > appointment.start_time))
      )

      // 日付順にソートして最も近い予約を取得
      if (futureAppointments.length > 0) {
        futureAppointments.sort((a, b) => {
          if (a.appointment_date !== b.appointment_date) {
            return a.appointment_date.localeCompare(b.appointment_date)
          }
          return a.start_time.localeCompare(b.start_time)
        })
        setNextAppointment(futureAppointments[0])
      }
    } catch (error) {
      console.error('次回予約取得エラー:', error)
    }
  }

  const handlePatientClick = () => {
    if (patient?.id) {
      onClose()
      router.push(`/patients/${patient.id}`)
    }
  }

  if (!isOpen || !appointment) return null

  const patient = appointment.patient
  const staff = appointment.staff1 || appointment.staff2 || appointment.staff3
  const menu = appointment.menu1 || appointment.menu2 || appointment.menu3

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-red-600">キャンセル情報</CardTitle>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 患者情報 */}
            <div
              className="bg-gray-50 p-4 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={handlePatientClick}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">患者情報</span>
                </div>
                {patient?.id && (
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">名前:</span>
                  <span className="ml-2 font-medium">
                    {patient ? `${patient.last_name} ${patient.first_name}` : '患者情報なし'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">診察券番号:</span>
                  <span className="ml-2 font-medium">
                    {patient?.patient_number && patient?.is_registered ? patient.patient_number : '未発行'}
                  </span>
                </div>
                {patient?.phone && (
                  <div className="col-span-2">
                    <span className="text-gray-500">電話:</span>
                    <span className="ml-2 font-medium">{patient.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 予約情報 */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">予約情報</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">予約日:</span>
                  <span className="ml-2 font-medium">{appointment.appointment_date}</span>
                </div>
                <div>
                  <span className="text-gray-500">時間:</span>
                  <span className="ml-2 font-medium">{appointment.start_time} - {appointment.end_time}</span>
                </div>
                <div>
                  <span className="text-gray-500">メニュー:</span>
                  <span className="ml-2 font-medium">{menu?.name || '未設定'}</span>
                </div>
                <div>
                  <span className="text-gray-500">担当:</span>
                  <span className="ml-2 font-medium">{staff?.name || '未設定'}</span>
                </div>
              </div>
            </div>

            {/* キャンセル情報 */}
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-4 h-4 text-red-500" />
                <span className="font-medium text-red-700">キャンセル情報</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-red-600 font-medium">キャンセル理由:</span>
                    <div className="ml-2 mt-1">
                      {loading ? '読み込み中...' : (cancelReason?.name || '不明')}
                    </div>
                  </div>
                  <div>
                    {(() => {
                      // メモからキャンセル時メモを抽出
                      const memo = appointment.memo || ''
                      const cancelMemoMatch = memo.match(/\[キャンセル時メモ\]\n([\s\S]*?)(?:\n\n|$)/)
                      const cancelMemo = cancelMemoMatch ? cancelMemoMatch[1].trim() : ''

                      return (
                        <>
                          <span className="text-red-600 font-medium">メモ:</span>
                          <div className="ml-2 mt-1 whitespace-pre-wrap">
                            {cancelMemo || 'なし'}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-red-600 font-medium">キャンセル日時:</span>
                  <span className="ml-2">
                    {appointment.cancelled_at
                      ? new Date(appointment.cancelled_at).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '不明'}
                  </span>
                </div>
                <div>
                  <span className="text-red-600 font-medium">次回予約:</span>
                  <span className="ml-2">
                    {nextAppointment
                      ? `${nextAppointment.appointment_date} ${nextAppointment.start_time}`
                      : '無し'}
                  </span>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end pt-4">
              <Button onClick={onClose}>
                閉じる
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
