'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { DentalChart } from './dental-chart'
import { VisualInputPanel } from './visual-input-panel'
import type { VisualToothData, ToothStatus, CariesLevel, RestorationType, MaterialType } from '@/lib/api/visual-exams'

// 全ての歯番号（32本）- 入力順序: 左上→右上→左下→右下
const ALL_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

// 入力順序（上段：左→右、下段：右→左）
const INPUT_ORDER = [
  11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28,
  38, 37, 36, 35, 34, 33, 32, 31, 48, 47, 46, 45, 44, 43, 42, 41,
]

interface VisualExamCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (toothData: VisualToothData[]) => void
  initialData?: VisualToothData[]
}

export function VisualExamCreateModal({ isOpen, onClose, onSave, initialData }: VisualExamCreateModalProps) {
  // 歯牙データ（歯番号をキーとするマップ）
  const [toothDataMap, setToothDataMap] = useState<Record<number, VisualToothData>>(() => {
    if (initialData) {
      const map: Record<number, VisualToothData> = {}
      initialData.forEach(tooth => {
        map[tooth.tooth_number] = tooth
      })
      return map
    }
    // 初期値：全ての歯を健全状態で初期化
    const map: Record<number, VisualToothData> = {}
    ALL_TEETH.forEach(toothNumber => {
      map[toothNumber] = {
        tooth_number: toothNumber,
        status: 'healthy',
      }
    })
    return map
  })

  // 選択中の歯
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set())

  // 歯をクリック
  const handleToothClick = (toothNumber: number) => {
    const newSelection = new Set(selectedTeeth)
    if (newSelection.has(toothNumber)) {
      newSelection.delete(toothNumber)
    } else {
      newSelection.add(toothNumber)
    }
    setSelectedTeeth(newSelection)
  }

  // 状態を適用
  const handleApplyStatus = (
    status: ToothStatus,
    cariesLevel?: CariesLevel,
    restorationType?: RestorationType,
    materialType?: MaterialType
  ) => {
    if (selectedTeeth.size === 0) return

    const newToothDataMap = { ...toothDataMap }

    // 現在選択中の歯の最大インデックスを取得
    let maxIndex = -1
    selectedTeeth.forEach(toothNumber => {
      const index = INPUT_ORDER.indexOf(toothNumber)
      if (index > maxIndex) {
        maxIndex = index
      }

      newToothDataMap[toothNumber] = {
        ...newToothDataMap[toothNumber],
        status,
        caries_level: status === 'caries' ? cariesLevel : undefined,
        restoration_type: status === 'restoration' ? restorationType : undefined,
        material_type: status === 'restoration' ? materialType : undefined,
      }
    })

    setToothDataMap(newToothDataMap)

    // 次の歯を自動選択
    const nextIndex = maxIndex + 1
    if (nextIndex < INPUT_ORDER.length) {
      const nextTooth = INPUT_ORDER[nextIndex]
      setSelectedTeeth(new Set([nextTooth]))
    } else {
      setSelectedTeeth(new Set()) // 最後の歯の場合は選択解除
    }
  }

  // 選択解除
  const handleClearSelection = () => {
    setSelectedTeeth(new Set())
  }

  // 保存
  const handleSave = () => {
    const toothDataArray = ALL_TEETH.map(toothNumber => toothDataMap[toothNumber])
    onSave(toothDataArray)
    handleClose()
  }

  // キャンセル
  const handleClose = () => {
    // 状態をリセット
    setSelectedTeeth(new Set())
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="large" className="max-w-[95vw] max-h-[95vh]">
      <div className="p-6 space-y-6">
        {/* 歯列図 */}
        <DentalChart
          toothData={toothDataMap}
          selectedTeeth={selectedTeeth}
          onToothClick={handleToothClick}
        />

        {/* 入力パネル */}
        <VisualInputPanel
          selectedTeeth={selectedTeeth}
          onApplyStatus={handleApplyStatus}
          onClearSelection={handleClearSelection}
        />

        {/* ボタン */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            保存
          </Button>
        </div>
      </div>
    </Modal>
  )
}
