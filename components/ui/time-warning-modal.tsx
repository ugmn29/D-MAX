'use client'

import { AlertTriangle, Clock, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

interface TimeWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isBreakTime: boolean
  isOutsideBusinessHours: boolean
  warningMessage: string
  startTime: string
  endTime: string
}

export function TimeWarningModal({
  isOpen,
  onClose,
  onConfirm,
  isBreakTime,
  isOutsideBusinessHours,
  warningMessage,
  startTime,
  endTime
}: TimeWarningModalProps) {
  const getIcon = () => {
    if (isBreakTime) {
      return <Coffee className="w-6 h-6 text-orange-500" />
    }
    if (isOutsideBusinessHours) {
      return <Clock className="w-6 h-6 text-red-500" />
    }
    return <AlertTriangle className="w-6 h-6 text-yellow-500" />
  }

  const getTitle = () => {
    if (isBreakTime) {
      return '休憩時間での予約作成'
    }
    if (isOutsideBusinessHours) {
      return '診療時間外での予約作成'
    }
    return '予約時間の確認'
  }

  const getDescription = () => {
    if (isBreakTime) {
      return '選択された時間は休憩時間と重複しています。休憩時間での予約作成は通常推奨されません。'
    }
    if (isOutsideBusinessHours) {
      return '選択された時間は診療時間外です。診療時間外での予約作成は特別な場合のみです。'
    }
    return '予約時間に問題がある可能性があります。'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            {getTitle()}
          </h3>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-600">
            {getDescription()}
          </p>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-700 mb-1">
              <strong>予約時間:</strong>
            </p>
            <p className="text-sm text-gray-600">
              {startTime} ～ {endTime}
            </p>
          </div>

          {warningMessage && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>詳細:</strong> {warningMessage}
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2"
          >
            キャンセル
          </Button>
          <Button
            onClick={onConfirm}
            className="px-4 py-2"
          >
            確定して予約作成
          </Button>
        </div>
      </div>
    </Modal>
  )
}
