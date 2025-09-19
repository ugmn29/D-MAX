'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ShiftPattern } from '@/types/database'

interface StaffScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  staffName: string
  patterns: ShiftPattern[]
  initialSchedule?: WeeklySchedule
  onSave: (weeklySchedule: WeeklySchedule) => void
}

interface WeeklySchedule {
  monday: string | null
  tuesday: string | null
  wednesday: string | null
  thursday: string | null
  friday: string | null
  saturday: string | null
  sunday: string | null
}

const WEEKDAYS = [
  { key: 'monday', name: '月曜日', label: '月' },
  { key: 'tuesday', name: '火曜日', label: '火' },
  { key: 'wednesday', name: '水曜日', label: '水' },
  { key: 'thursday', name: '木曜日', label: '木' },
  { key: 'friday', name: '金曜日', label: '金' },
  { key: 'saturday', name: '土曜日', label: '土' },
  { key: 'sunday', name: '日曜日', label: '日' }
]

export function StaffScheduleModal({
  isOpen,
  onClose,
  staffName,
  patterns,
  initialSchedule,
  onSave
}: StaffScheduleModalProps) {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null
  })

  // モーダルが開かれた時に初期値を設定
  useEffect(() => {
    if (isOpen && initialSchedule) {
      setWeeklySchedule(initialSchedule)
    } else if (isOpen) {
      // 初期値がない場合はリセット
      setWeeklySchedule({
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null,
        saturday: null,
        sunday: null
      })
    }
  }, [isOpen, initialSchedule])

  const handleDayChange = (day: string, value: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: value === 'none' ? null : value
    }))
  }

  const handleSave = () => {
    onSave(weeklySchedule)
    onClose()
  }

  const handleClearAll = () => {
    setWeeklySchedule({
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null
    })
  }

  const handleSetWeekdays = () => {
    setWeeklySchedule(prev => ({
      ...prev,
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null
    }))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="固定シフト設定"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{staffName}</span> の固定シフトを設定します
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ※ 過去の日付は変更されません（今日以降の日付のみ適用されます）
          </p>
        </div>

        <div className="space-y-3">
          {WEEKDAYS.map((day) => (
            <div key={day.key} className="flex items-center space-x-3">
              <div className="w-12 text-sm font-medium text-gray-700">
                {day.label}
              </div>
              <div className="flex-1">
                <Select
                  value={weeklySchedule[day.key as keyof WeeklySchedule] || 'none'}
                  onValueChange={(value) => handleDayChange(day.key, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="パターンを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">勤務なし</SelectItem>
                    {patterns.map((pattern) => (
                      <SelectItem key={pattern.id} value={pattern.id}>
                        {pattern.abbreviation} - {pattern.name} ({pattern.start_time.substring(0, 5)} - {pattern.end_time.substring(0, 5)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={handleSetWeekdays}
            className="flex-1"
          >
            平日のみ設定
          </Button>
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="flex-1"
          >
            全てクリア
          </Button>
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
