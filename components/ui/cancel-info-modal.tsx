'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Calendar, Clock, User, Phone, FileText } from 'lucide-react'
import { getCancelReasons } from '@/lib/api/cancel-reasons'

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
  const [cancelReason, setCancelReason] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && appointment?.cancel_reason_id) {
      loadCancelReason()
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
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">患者情報</span>
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
                <div>
                  <span className="text-gray-500">登録状況:</span>
                  <span className="ml-2 font-medium">
                    {patient?.is_registered ? '本登録' : '仮登録'}
                  </span>
                </div>
                {patient?.phone && (
                  <div>
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
                <div>
                  <span className="text-red-600 font-medium">キャンセル理由:</span>
                  <span className="ml-2">
                    {loading ? '読み込み中...' : (cancelReason?.name || '不明')}
                  </span>
                </div>
                {cancelReason?.description && (
                  <div>
                    <span className="text-red-600 font-medium">詳細:</span>
                    <span className="ml-2">{cancelReason.description}</span>
                  </div>
                )}
                <div>
                  <span className="text-red-600 font-medium">キャンセル日時:</span>
                  <span className="ml-2">
                    {appointment.cancelled_at ? new Date(appointment.cancelled_at).toLocaleString('ja-JP') : '不明'}
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
