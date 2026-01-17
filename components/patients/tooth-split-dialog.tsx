'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface ToothSplitDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedTeeth: number[]) => void
  allTeeth: number[]
  initialSelectedTooth: number
}

// 全ての永久歯番号
const ALL_PERMANENT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

export function ToothSplitDialog({
  isOpen,
  onClose,
  onConfirm,
  allTeeth,
  initialSelectedTooth
}: ToothSplitDialogProps) {
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set([initialSelectedTooth]))
  const [isDragging, setIsDragging] = useState(false)

  // モーダルが開いた時に初期選択をリセット
  useEffect(() => {
    if (isOpen) {
      setSelectedTeeth(new Set([initialSelectedTooth]))
    }
  }, [isOpen, initialSelectedTooth])

  // 対象歯のセット（allTeethに含まれる歯のみ選択可能）
  const availableTeethSet = new Set(allTeeth)

  const handleToggle = (toothNumber: number) => {
    if (!availableTeethSet.has(toothNumber)) return
    if (isDragging) return

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

  // ドラッグ開始
  const handleDragStart = (toothNumber: number) => {
    if (!availableTeethSet.has(toothNumber)) return
    setIsDragging(true)
    setSelectedTeeth(prev => {
      const newSet = new Set(prev)
      newSet.add(toothNumber)
      return newSet
    })
  }

  // ドラッグ中
  const handleDragEnter = (toothNumber: number) => {
    if (!isDragging || !availableTeethSet.has(toothNumber)) return
    setSelectedTeeth(prev => {
      const newSet = new Set(prev)
      newSet.add(toothNumber)
      return newSet
    })
  }

  // ドラッグ終了
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleConfirm = () => {
    if (selectedTeeth.size === 0) {
      alert('分割する歯を選択してください')
      return
    }
    if (selectedTeeth.size === allTeeth.length) {
      alert('全ての歯を選択することはできません。一部を残してください')
      return
    }
    onConfirm(Array.from(selectedTeeth).sort((a, b) => a - b))
    onClose()
  }

  const handleCancel = () => {
    setSelectedTeeth(new Set([initialSelectedTooth]))
    onClose()
  }

  // 歯ボタンのレンダリング
  const renderToothButton = (tooth: number) => {
    const isAvailable = availableTeethSet.has(tooth)
    const isSelected = selectedTeeth.has(tooth)

    return (
      <button
        key={tooth}
        onMouseDown={() => handleDragStart(tooth)}
        onMouseEnter={() => handleDragEnter(tooth)}
        onTouchStart={() => handleDragStart(tooth)}
        onClick={() => !isDragging && handleToggle(tooth)}
        disabled={!isAvailable}
        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
          !isAvailable
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : isSelected
              ? 'bg-purple-500 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-purple-50'
        }`}
      >
        {tooth % 10}
      </button>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="medium">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">分割する歯を選択してください</h2>
        <p className="text-sm text-gray-500">選択した歯が新しいカードに分割されます</p>

        {/* 歯列表 */}
        <div
          className="border rounded-lg p-3 bg-gray-50 select-none"
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchEnd={handleDragEnd}
        >
          {/* 上顎 */}
          <div className="flex justify-center gap-0.5 mb-1">
            {/* 右上 (18-11) */}
            {[18, 17, 16, 15, 14, 13, 12, 11].map(renderToothButton)}
            <div className="w-2" />
            {/* 左上 (21-28) */}
            {[21, 22, 23, 24, 25, 26, 27, 28].map(renderToothButton)}
          </div>
          {/* 区切り線 */}
          <div className="flex justify-center items-center my-1">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-2 text-xs text-gray-400">上</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>
          <div className="flex justify-center items-center my-1">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-2 text-xs text-gray-400">下</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>
          {/* 下顎 */}
          <div className="flex justify-center gap-0.5 mt-1">
            {/* 右下 (48-41) */}
            {[48, 47, 46, 45, 44, 43, 42, 41].map(renderToothButton)}
            <div className="w-2" />
            {/* 左下 (31-38) */}
            {[31, 32, 33, 34, 35, 36, 37, 38].map(renderToothButton)}
          </div>
          {/* ラベル */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>右</span>
            <span>左</span>
          </div>
        </div>

        {/* 選択中の歯番号表示 */}
        <div className="text-sm">
          <span className="font-medium text-gray-700">分割対象: </span>
          {selectedTeeth.size > 0 ? (
            <span className="text-purple-600 font-medium">
              {Array.from(selectedTeeth).sort((a, b) => a - b).join(', ')}番
            </span>
          ) : (
            <span className="text-gray-400">なし</span>
          )}
        </div>
        <div className="text-sm">
          <span className="font-medium text-gray-700">残る歯: </span>
          {allTeeth.filter(t => !selectedTeeth.has(t)).length > 0 ? (
            <span className="text-blue-600 font-medium">
              {allTeeth.filter(t => !selectedTeeth.has(t)).sort((a, b) => a - b).join(', ')}番
            </span>
          ) : (
            <span className="text-red-500">なし（全て選択されています）</span>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={selectedTeeth.size === 0 || selectedTeeth.size === allTeeth.length}
          >
            分割実行
          </Button>
        </div>
      </div>
    </Modal>
  )
}
