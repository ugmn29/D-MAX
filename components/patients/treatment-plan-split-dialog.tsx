'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TreatmentPlanSplitDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedTeeth: number[]) => void
  treatmentContent: string
  availableTeeth: number[]  // この治療計画内の歯のみ
}

export function TreatmentPlanSplitDialog({
  isOpen,
  onClose,
  onConfirm,
  treatmentContent,
  availableTeeth,
}: TreatmentPlanSplitDialogProps) {
  // 選択中の歯番号
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set())
  // ドラッグ選択中フラグ
  const [isDragging, setIsDragging] = useState(false)

  // 利用可能な歯のセット
  const availableTeethSet = new Set(availableTeeth)

  // モーダルが開いた時に初期化
  useEffect(() => {
    if (isOpen) {
      setSelectedTeeth(new Set())
    }
  }, [isOpen])

  if (!isOpen) return null

  // 歯をクリック（複数選択対応）
  const handleToothClick = (toothNumber: number) => {
    // ドラッグ中はクリックを無視
    if (isDragging) return
    // 利用可能な歯のみ選択可能
    if (!availableTeethSet.has(toothNumber)) return

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

  // ドラッグ中に歯に入った時
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

  // 全選択解除
  const handleClearAll = () => {
    setSelectedTeeth(new Set())
  }

  // 確定
  const handleConfirm = () => {
    if (selectedTeeth.size === 0) {
      alert('分割する歯を選択してください')
      return
    }
    if (selectedTeeth.size === availableTeeth.length) {
      alert('全ての歯を選択することはできません')
      return
    }
    onConfirm(Array.from(selectedTeeth).sort((a, b) => a - b))
  }

  // 歯式の表で歯をレンダリング
  const renderTooth = (tooth: number) => {
    const isAvailable = availableTeethSet.has(tooth)
    const isSelected = selectedTeeth.has(tooth)

    return (
      <button
        key={tooth}
        onClick={() => handleToothClick(tooth)}
        onMouseDown={() => handleDragStart(tooth)}
        onMouseEnter={() => handleDragEnter(tooth)}
        onTouchStart={() => handleDragStart(tooth)}
        disabled={!isAvailable}
        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
          !isAvailable
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : isSelected
              ? 'bg-blue-500 text-white'
              : 'bg-amber-100 border border-amber-400 text-amber-700 hover:bg-amber-200'
        }`}
      >
        {tooth % 10}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-auto max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">治療計画を分割</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 説明 */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800">
              「{treatmentContent}」から分割する歯を選択
            </div>
            <div className="text-xs text-blue-600 mt-1">
              選択した歯が新しい治療計画として分離されます
            </div>
          </div>

          {/* クイック選択ボタン */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={selectedTeeth.size === 0}
            >
              選択解除
            </Button>
          </div>

          {/* 歯列図（ボタン形式） */}
          <div
            className="border rounded-lg p-3 bg-gray-50 select-none"
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchEnd={handleDragEnd}
          >
            {/* 上顎 */}
            <div className="flex justify-center gap-0.5 mb-1">
              {/* 右上 (18-11) */}
              {[18, 17, 16, 15, 14, 13, 12, 11].map(renderTooth)}
              <div className="w-2" />
              {/* 左上 (21-28) */}
              {[21, 22, 23, 24, 25, 26, 27, 28].map(renderTooth)}
            </div>
            {/* 区切り線（上） */}
            <div className="flex justify-center items-center my-1">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-2 text-xs text-gray-400">上</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>
            {/* 区切り線（下） */}
            <div className="flex justify-center items-center my-1">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-2 text-xs text-gray-400">下</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>
            {/* 下顎 */}
            <div className="flex justify-center gap-0.5 mt-1">
              {/* 右下 (48-41) */}
              {[48, 47, 46, 45, 44, 43, 42, 41].map(renderTooth)}
              <div className="w-2" />
              {/* 左下 (31-38) */}
              {[31, 32, 33, 34, 35, 36, 37, 38].map(renderTooth)}
            </div>
            {/* ラベル */}
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>右</span>
              <span>左</span>
            </div>
          </div>

          {/* 選択中の歯番号表示 */}
          {selectedTeeth.size > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                分割する歯: {selectedTeeth.size}本
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedTeeth)
                  .sort((a, b) => a - b)
                  .map(toothNumber => (
                    <span
                      key={toothNumber}
                      className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                    >
                      {toothNumber}番
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedTeeth.size === 0 || selectedTeeth.size === availableTeeth.length}
            className="bg-blue-600 hover:bg-blue-700"
          >
            分割する（{selectedTeeth.size}本）
          </Button>
        </div>
      </div>
    </div>
  )
}
