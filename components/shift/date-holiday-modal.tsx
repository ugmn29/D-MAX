'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface DateHolidayModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  isCurrentlyHoliday: boolean
  onSave: (isHoliday: boolean) => void
}

export const DateHolidayModal: React.FC<DateHolidayModalProps> = ({
  isOpen,
  onClose,
  date,
  isCurrentlyHoliday,
  onSave
}) => {
  const [isHoliday, setIsHoliday] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsHoliday(isCurrentlyHoliday)
    }
  }, [isOpen, isCurrentlyHoliday])

  const handleSave = () => {
    onSave(isHoliday)
    onClose()
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
      title="休診日設定"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{formatDate(date)}</span> の休診日設定
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_holiday"
            checked={isHoliday}
            onCheckedChange={(checked) => setIsHoliday(checked as boolean)}
          />
          <Label 
            htmlFor="is_holiday" 
            className="cursor-pointer select-none"
          >
            この日を休診日にする
          </Label>
        </div>

        <div className="text-xs text-gray-500">
          <p>• 医院設定の休診日（曜日）は自動的に適用されます</p>
          <p>• この設定は個別の日付のみに適用されます</p>
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
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  )
}
