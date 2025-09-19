'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { getHolidays, setClinicSetting } from '@/lib/api/clinic'

interface BulkHolidayModalProps {
  isOpen: boolean
  onClose: () => void
  clinicId: string
  onSave: () => void
}

export const BulkHolidayModal: React.FC<BulkHolidayModalProps> = ({
  isOpen,
  onClose,
  clinicId,
  onSave
}) => {
  const [holidays, setHolidays] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (isOpen) {
      loadHolidays()
    }
  }, [isOpen, clinicId])

  const loadHolidays = async () => {
    try {
      const currentHolidays = await getHolidays(clinicId)
      setHolidays(currentHolidays)
    } catch (error) {
      console.error('休診日読み込みエラー:', error)
    }
  }

  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setHolidays(prev => [...prev, day])
    } else {
      setHolidays(prev => prev.filter(d => d !== day))
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      await setClinicSetting(clinicId, 'holidays', holidays)
      onSave()
      onClose()
    } catch (error) {
      console.error('休診日保存エラー:', error)
      alert('休診日の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const daysOfWeek = [
    { key: 'monday', name: '月曜日' },
    { key: 'tuesday', name: '火曜日' },
    { key: 'wednesday', name: '水曜日' },
    { key: 'thursday', name: '木曜日' },
    { key: 'friday', name: '金曜日' },
    { key: 'saturday', name: '土曜日' },
    { key: 'sunday', name: '日曜日' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="医院休診日設定"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            医院の定期的な休診日（曜日）を設定します
          </p>
        </div>

        <div className="space-y-2">
          {daysOfWeek.map(day => (
            <div key={day.key} className="flex items-center space-x-2">
              <Checkbox
                id={day.key}
                checked={holidays.includes(day.key)}
                onCheckedChange={(checked) => handleDayChange(day.key, checked as boolean)}
              />
              <Label 
                htmlFor={day.key}
                className="cursor-pointer select-none"
              >
                {day.name}
              </Label>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500">
          <p>• 設定した曜日は毎週休診日として扱われます</p>
          <p>• 個別の日付設定は後から変更可能です</p>
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
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
