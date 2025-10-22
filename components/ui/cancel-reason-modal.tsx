'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'
import { getCancelReasons } from '@/lib/api/cancel-reasons'
import { cancelAppointment } from '@/lib/api/appointments'
import { CancelReason } from '@/lib/api/cancel-reasons'

interface CancelReasonModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string
  patientName: string
  appointmentTime: string
  onCancelSuccess: () => void
  existingMemo?: string // 既存のメモ
  appointmentData?: any // 予約データ全体（コピー用）
  onCancelAndReschedule?: (appointment: any) => void // キャンセルして別日予約
}

export function CancelReasonModal({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  appointmentTime,
  onCancelSuccess,
  existingMemo = '',
  appointmentData,
  onCancelAndReschedule
}: CancelReasonModalProps) {
  const [cancelReasons, setCancelReasons] = useState<CancelReason[]>([])
  const [selectedReasonId, setSelectedReasonId] = useState<string>('')
  const [cancelMemo, setCancelMemo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // キャンセル理由を取得
  useEffect(() => {
    if (isOpen) {
      loadCancelReasons()
    }
  }, [isOpen])

  const loadCancelReasons = async () => {
    try {
      setLoading(true)
      // デモクリニックIDを使用
      const reasons = await getCancelReasons('11111111-1111-1111-1111-111111111111')
      setCancelReasons(reasons)
    } catch (error) {
      console.error('キャンセル理由取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!selectedReasonId) {
      alert('キャンセル理由を選択してください')
      return
    }

    try {
      setSaving(true)
      // デモスタッフIDを使用、キャンセルメモも渡す
      await cancelAppointment(
        appointmentId,
        selectedReasonId,
        '11111111-1111-1111-1111-111111111111',
        cancelMemo.trim() || undefined
      )
      onCancelSuccess()
      onClose()
    } catch (error) {
      console.error('予約キャンセルエラー:', error)
      alert('予約のキャンセルに失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelAndReschedule = async () => {
    if (!selectedReasonId) {
      alert('キャンセル理由を選択してください')
      return
    }

    if (!appointmentData || !onCancelAndReschedule) {
      alert('予約データが見つかりません')
      return
    }

    try {
      setSaving(true)
      // 予約をキャンセル
      await cancelAppointment(
        appointmentId,
        selectedReasonId,
        '11111111-1111-1111-1111-111111111111',
        cancelMemo.trim() || undefined
      )

      // コピーモードに入る
      onCancelAndReschedule(appointmentData)
      onClose()
    } catch (error) {
      console.error('予約キャンセルエラー:', error)
      alert('予約のキャンセルに失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">予約キャンセル</CardTitle>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 予約情報 */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">
                <div><strong>患者:</strong> {patientName}</div>
                <div><strong>予約時間:</strong> {appointmentTime}</div>
              </div>
            </div>

            {/* キャンセル理由選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                キャンセル理由を選択してください
              </label>
              
              {loading ? (
                <div className="text-center py-4">読み込み中...</div>
              ) : (
                <div className="space-y-2">
                  {cancelReasons.map((reason) => (
                    <label
                      key={reason.id}
                      className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason.id}
                        checked={selectedReasonId === reason.id}
                        onChange={(e) => setSelectedReasonId(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{reason.name}</div>
                        {reason.description && (
                          <div className="text-sm text-gray-500 mt-1">{reason.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* メモ欄 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メモ（任意）
              </label>
              <textarea
                value={cancelMemo}
                onChange={(e) => setCancelMemo(e.target.value)}
                placeholder="キャンセルに関する補足事項があれば入力してください"
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y"
              />
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              {onCancelAndReschedule && appointmentData && (
                <Button
                  onClick={handleCancelAndReschedule}
                  disabled={!selectedReasonId || saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? '処理中...' : 'キャンセルして別日予約'}
                </Button>
              )}
              <Button
                onClick={handleCancel}
                disabled={!selectedReasonId || saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? 'キャンセル中...' : '予約キャンセル'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
