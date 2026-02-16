'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface WorkingDayModalProps {
  isOpen: boolean
  onClose: () => void
  clinicId: string
  date: string
  onSave: () => void
}

export const WorkingDayModal: React.FC<WorkingDayModalProps> = ({
  isOpen,
  onClose,
  clinicId,
  date,
  onSave
}) => {
  const [isWorkingDay, setIsWorkingDay] = useState(true)
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setIsWorkingDay(true) // デフォルトは診療日にする
    }
  }, [isOpen])

  const handleSave = async () => {
    console.log('working-day-modal: handleSave開始', { isWorkingDay, clinicId, date })
    try {
      setLoading(true)

      let response: Response

      if (isWorkingDay) {
        // 診療日に設定する場合は個別休診日設定を削除
        response = await fetch('/api/individual-holidays', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clinic_id: clinicId,
            date
          })
        })
      } else {
        // 休診日に設定する場合は個別休診日を登録
        response = await fetch('/api/individual-holidays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clinic_id: clinicId,
            date,
            is_holiday: true
          })
        })
      }

      if (!response.ok) {
        throw new Error('休診日設定の更新に失敗しました')
      }

      const data = await response.json()

      if (data.error) {
        console.error('個別休診日更新エラー:', data.error)
      }

      // カスタムイベントを発火してシフト表・カレンダーに通知
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('individualHolidaysUpdated', {
          detail: { clinicId, date, isWorkingDay }
        })
        window.dispatchEvent(event)
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('診療日設定エラー:', error)
      alert('診療日の設定に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
    return `${year}年${month}月${day}日（${dayOfWeek}）`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="診療日設定"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{formatDate(date)}</span> を診療日に設定します
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_working_day"
            checked={isWorkingDay}
            onCheckedChange={(checked) => setIsWorkingDay(checked as boolean)}
          />
          <Label 
            htmlFor="is_working_day"
            className="cursor-pointer select-none"
          >
            この日を診療日にする
          </Label>
        </div>

        <div className="text-xs text-gray-500">
          <p>• この日は通常の診療日として扱われます</p>
          <p>• 医院設定の休診日（曜日）は引き続き適用されます</p>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '設定中...' : '診療日に設定'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
