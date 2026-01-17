'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { DentalChart } from './visual/dental-chart'
import type { VisualToothData } from '@/lib/api/visual-exams'

// 永久歯の歯番号（32本）
const PERMANENT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

// 乳歯の歯番号（20本）
const DECIDUOUS_TEETH = [
  55, 54, 53, 52, 51,
  61, 62, 63, 64, 65,
  85, 84, 83, 82, 81,
  71, 72, 73, 74, 75,
]

const ALL_TEETH = [...PERMANENT_TEETH, ...DECIDUOUS_TEETH]

interface ToothSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (selectedTeeth: number[]) => void
  initialSelected?: number[]
}

export function ToothSelectorModal({
  isOpen,
  onClose,
  onSelect,
  initialSelected = []
}: ToothSelectorModalProps) {
  // 選択中の歯番号
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(
    new Set(initialSelected)
  )

  // 歯牙データ（表示用のみ、全て健全状態）
  const [toothDataMap] = useState<Record<number, VisualToothData>>(() => {
    const map: Record<number, VisualToothData> = {}
    ALL_TEETH.forEach(toothNumber => {
      map[toothNumber] = {
        tooth_number: toothNumber,
        status: 'healthy',
      }
    })
    return map
  })

  // 歯をクリック（複数選択対応）
  const handleToothClick = (toothNumber: number) => {
    setSelectedTeeth(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toothNumber)) {
        newSet.delete(toothNumber)
      } else {
        newSet.add(toothNumber)
      }
      return newSet
    })
  }

  // 全選択解除
  const handleClearAll = () => {
    setSelectedTeeth(new Set())
  }

  // 確定
  const handleConfirm = () => {
    onSelect(Array.from(selectedTeeth).sort((a, b) => a - b))
    onClose()
  }

  // キャンセル
  const handleCancel = () => {
    setSelectedTeeth(new Set(initialSelected))
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="large" className="max-w-[90vw]">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">対象歯を選択</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={selectedTeeth.size === 0}
          >
            選択解除
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          治療対象の歯をクリックして選択してください（複数選択可）
        </div>

        {/* 歯列図 */}
        <DentalChart
          toothData={toothDataMap}
          selectedTeeth={selectedTeeth}
          onToothClick={handleToothClick}
        />

        {/* 選択中の歯番号表示 */}
        {selectedTeeth.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="text-sm font-medium text-gray-700 mb-1">
              選択中の歯: {selectedTeeth.size}本
            </div>
            <div className="text-sm text-gray-600">
              {Array.from(selectedTeeth)
                .sort((a, b) => a - b)
                .join(', ')}
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={selectedTeeth.size === 0}
          >
            確定
          </Button>
        </div>
      </div>
    </Modal>
  )
}
