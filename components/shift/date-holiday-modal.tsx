'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'

export type HolidayType = 'none' | 'full' | 'timeRange'

export interface TimeRange {
  startTime: string
  endTime: string
}

interface DateHolidayModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  currentHolidayType: HolidayType
  currentTimeRanges: TimeRange[]
  onSave: (type: 'full' | 'timeRange', timeRanges?: TimeRange[]) => void
  onDelete?: () => void
}

export const DateHolidayModal: React.FC<DateHolidayModalProps> = ({
  isOpen,
  onClose,
  date,
  currentHolidayType,
  currentTimeRanges,
  onSave,
  onDelete
}) => {
  const [selectedType, setSelectedType] = useState<HolidayType>('none')
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([{ startTime: '09:00', endTime: '12:00' }])

  useEffect(() => {
    if (isOpen) {
      setSelectedType(currentHolidayType === 'none' ? 'full' : currentHolidayType)
      setTimeRanges(
        currentTimeRanges.length > 0
          ? currentTimeRanges
          : [{ startTime: '09:00', endTime: '12:00' }]
      )
    }
  }, [isOpen, currentHolidayType, currentTimeRanges])

  const handleSave = () => {
    if (selectedType === 'full') {
      onSave('full')
    } else {
      const validRanges = timeRanges.filter(r => r.startTime && r.endTime && r.startTime < r.endTime)
      if (validRanges.length === 0) {
        alert('有効な時間帯を1つ以上入力してください（開始 < 終了）')
        return
      }
      onSave('timeRange', validRanges)
    }
    onClose()
  }

  const addTimeRange = () => {
    setTimeRanges(prev => [...prev, { startTime: '13:00', endTime: '18:00' }])
  }

  const removeTimeRange = (index: number) => {
    setTimeRanges(prev => prev.filter((_, i) => i !== index))
  }

  const updateTimeRange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setTimeRanges(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${dayOfWeek}）`
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="休診日設定">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{formatDate(date)}</span> の休診設定
        </p>

        {/* 全日休診 */}
        <div
          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            selectedType === 'full' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => setSelectedType('full')}
        >
          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
            selectedType === 'full' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
          }`}>
            {selectedType === 'full' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
          </div>
          <div>
            <Label className="cursor-pointer font-medium">全日休診</Label>
            <p className="text-xs text-gray-500">その日を丸ごと休診にします</p>
          </div>
        </div>

        {/* 時間帯休診 */}
        <div
          className={`p-3 rounded-lg border transition-colors ${
            selectedType === 'timeRange' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
          }`}
        >
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setSelectedType('timeRange')}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
              selectedType === 'timeRange' ? 'border-amber-500 bg-amber-500' : 'border-gray-400'
            }`}>
              {selectedType === 'timeRange' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
            </div>
            <div>
              <Label className="cursor-pointer font-medium">時間帯休診</Label>
              <p className="text-xs text-gray-500">指定した時間帯だけ休診にします（複数可）</p>
            </div>
          </div>

          {selectedType === 'timeRange' && (
            <div className="mt-3 space-y-2 ml-7">
              {timeRanges.map((range, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={range.startTime}
                    onChange={e => updateTimeRange(index, 'startTime', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
                  />
                  <span className="text-gray-500 text-sm">〜</span>
                  <input
                    type="time"
                    value={range.endTime}
                    onChange={e => updateTimeRange(index, 'endTime', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-28"
                  />
                  {timeRanges.length > 1 && (
                    <button
                      onClick={() => removeTimeRange(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addTimeRange}
                className="flex items-center space-x-1 text-sm text-amber-600 hover:text-amber-800 transition-colors"
              >
                <Plus size={14} />
                <span>時間帯を追加</span>
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• 医院設定の休診日（曜日）は自動的に適用されます</p>
          <p>• この設定は個別の日付のみに適用されます</p>
        </div>

        <div className="flex justify-between items-center pt-2">
          {onDelete && currentHolidayType === 'timeRange' ? (
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => { onDelete(); onClose() }}
            >
              休診を削除
            </Button>
          ) : <div />}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>キャンセル</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
