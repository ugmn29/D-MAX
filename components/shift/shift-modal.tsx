'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShiftPattern } from '@/types/database'

interface ShiftModalProps {
  isOpen: boolean
  onClose: () => void
  staffName: string
  date: string
  patterns: ShiftPattern[]
  currentShift?: {
    shift_pattern_id: string | null
    is_holiday: boolean
  }
  onSave: (shiftPatternId: string | null, isHoliday: boolean) => void
}

export function ShiftModal({
  isOpen,
  onClose,
  staffName,
  date,
  patterns,
  currentShift,
  onSave
}: ShiftModalProps) {
  const [selectedPattern, setSelectedPattern] = useState<string>('none')

  // currentShiftが変更された時に状態を更新
  useEffect(() => {
    if (currentShift) {
      setSelectedPattern(currentShift.shift_pattern_id || 'none')
    } else {
      setSelectedPattern('none')
    }
  }, [currentShift])

  const handleSave = () => {
    onSave(selectedPattern === 'none' ? null : selectedPattern, false)
    onClose()
  }

  const handlePatternChange = (patternId: string) => {
    setSelectedPattern(patternId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="シフト設定"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{staffName}</span> - {formatDate(date)}
          </p>
        </div>

        <div>
          <Label htmlFor="shift_pattern">勤務パターン</Label>
          <Select
            value={selectedPattern}
            onValueChange={handlePatternChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="パターンを選択してください" />
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
