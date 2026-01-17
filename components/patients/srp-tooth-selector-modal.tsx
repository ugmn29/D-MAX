'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 歯番号をPalmer記法に変換する関数
const formatToothToPalmer = (toothNumber: number): string => {
  const str = toothNumber.toString()
  if (str.length < 2) return str

  const quadrant = str.charAt(0)
  const toothNum = str.slice(-1)

  // Palmer記法のUnicode記号で象限を表現
  switch (quadrant) {
    case '1': // 右上
      return `${toothNum}⏌`
    case '2': // 左上
      return `⎿${toothNum}`
    case '3': // 左下
      return `⎾${toothNum}`
    case '4': // 右下
      return `${toothNum}⏋`
    default:
      return str
  }
}

// 歯のブロック定義
const TOOTH_BLOCKS = {
  upperRight: { label: '右上', teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
  upperLeft: { label: '左上', teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
  lowerRight: { label: '右下', teeth: [48, 47, 46, 45, 44, 43, 42, 41] },
  lowerLeft: { label: '左下', teeth: [31, 32, 33, 34, 35, 36, 37, 38] },
} as const

type BlockKey = keyof typeof TOOTH_BLOCKS

// 永久歯の歯番号（32本）
const PERMANENT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

// 選択アイテムの型（ブロックまたは単一歯）
export interface SrpSelectionItem {
  id: string
  type: 'block' | 'tooth'
  blockKey?: BlockKey
  teeth: number[]
  label: string
}

// 4mm以上の歯の情報
export interface DeepPocketTooth {
  toothNumber: number
  maxDepth: number
  positions: string[]
}

interface SrpToothSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selections: SrpSelectionItem[]) => void
  title: string
  deepPocketTeeth: DeepPocketTooth[] // P検データから4mm以上の歯
  treatmentType: 'SRP' | 'Fop'
  existingTeeth?: number[]  // 他の治療で既に選択済みの歯（グレーアウト）
  missingTeeth?: number[]   // 欠損歯（グレーアウト）
}

export function SrpToothSelectorModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  deepPocketTeeth,
  treatmentType,
  existingTeeth = [],
  missingTeeth = []
}: SrpToothSelectorModalProps) {
  // 選択中の歯番号
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set())
  // ドラッグ選択中フラグ
  const [isDragging, setIsDragging] = useState(false)

  // 選択不可の歯（欠損歯 + 他の治療で選択済みの歯）
  const disabledTeeth = new Set([...existingTeeth, ...missingTeeth])

  // 4mm以上の歯番号のセット
  const deepPocketTeethSet = new Set(deepPocketTeeth.map(t => t.toothNumber))

  // モーダルが開いた時に初期化
  useEffect(() => {
    if (isOpen) {
      setSelectedTeeth(new Set())
    }
  }, [isOpen])

  if (!isOpen) return null

  // 歯をクリック（複数選択対応）
  const handleToothClick = (toothNumber: number) => {
    // ドラッグ中はクリックを無視（ドラッグ終了時に発火するため）
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
    if (disabledTeeth.has(toothNumber)) return
    setIsDragging(true)
    setSelectedTeeth(prev => {
      const newSet = new Set(prev)
      newSet.add(toothNumber)
      return newSet
    })
  }

  // ドラッグ中に歯に入った時
  const handleDragEnter = (toothNumber: number) => {
    if (!isDragging || disabledTeeth.has(toothNumber)) return
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

  // 4mm以上の歯を全選択（disabledな歯は除外）
  const handleSelectAllDeepPocket = () => {
    const deepPocketSet = new Set(
      deepPocketTeeth
        .map(t => t.toothNumber)
        .filter(t => !disabledTeeth.has(t))
    )
    setSelectedTeeth(deepPocketSet)
  }

  // ブロック選択（disabledな歯は除外）
  const handleSelectBlock = (blockKey: BlockKey) => {
    const blockTeeth = TOOTH_BLOCKS[blockKey].teeth.filter(t => !disabledTeeth.has(t))
    setSelectedTeeth(prev => {
      const newSet = new Set(prev)
      // ブロック内の選択可能な歯がすでに全て選択されているかチェック
      const allSelected = blockTeeth.every(t => newSet.has(t))
      if (allSelected) {
        // 全選択されている場合は解除
        blockTeeth.forEach(t => newSet.delete(t))
      } else {
        // そうでない場合は全選択
        blockTeeth.forEach(t => newSet.add(t))
      }
      return newSet
    })
  }

  // 確定
  const handleConfirm = () => {
    const teethArray = Array.from(selectedTeeth).sort((a, b) => a - b)

    // 選択した歯を1つのSrpSelectionItemにまとめる
    const selection: SrpSelectionItem = {
      id: `selection-${Date.now()}`,
      type: 'tooth',
      teeth: teethArray,
      label: teethArray.length === 1
        ? `${teethArray[0]}番`
        : `${teethArray.join(', ')}番（${teethArray.length}本）`
    }

    onConfirm([selection])
  }

  // 4mm以上の歯の情報を取得
  const getDeepPocketInfo = (toothNumber: number): DeepPocketTooth | undefined => {
    return deepPocketTeeth.find(t => t.toothNumber === toothNumber)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-auto max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">{title} 部位選択</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 説明 */}
          <div className="text-sm text-gray-600 mb-4">
            治療対象の歯をクリックして選択してください（複数選択可）
          </div>

          {/* クイック選択ボタン */}
          <div className="mb-4 flex flex-wrap gap-2">
            {deepPocketTeeth.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllDeepPocket}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                4mm以上を全選択
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectBlock('upperRight')}
            >
              右上ブロック
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectBlock('upperLeft')}
            >
              左上ブロック
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectBlock('lowerRight')}
            >
              右下ブロック
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectBlock('lowerLeft')}
            >
              左下ブロック
            </Button>
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
              {[18, 17, 16, 15, 14, 13, 12, 11].map(tooth => {
                const isDisabled = disabledTeeth.has(tooth)
                const isSelected = selectedTeeth.has(tooth)
                const isDeepPocket = deepPocketTeethSet.has(tooth)
                return (
                  <button
                    key={tooth}
                    onClick={() => handleToothClick(tooth)}
                    onMouseDown={() => handleDragStart(tooth)}
                    onMouseEnter={() => handleDragEnter(tooth)}
                    onTouchStart={() => handleDragStart(tooth)}
                    disabled={isDisabled}
                    className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                      isDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-500 text-white'
                          : isDeepPocket
                            ? 'bg-amber-100 border border-amber-400 text-amber-700 hover:bg-amber-200'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {tooth % 10}
                  </button>
                )
              })}
              <div className="w-2" />
              {/* 左上 (21-28) */}
              {[21, 22, 23, 24, 25, 26, 27, 28].map(tooth => {
                const isDisabled = disabledTeeth.has(tooth)
                const isSelected = selectedTeeth.has(tooth)
                const isDeepPocket = deepPocketTeethSet.has(tooth)
                return (
                  <button
                    key={tooth}
                    onClick={() => handleToothClick(tooth)}
                    onMouseDown={() => handleDragStart(tooth)}
                    onMouseEnter={() => handleDragEnter(tooth)}
                    onTouchStart={() => handleDragStart(tooth)}
                    disabled={isDisabled}
                    className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                      isDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-500 text-white'
                          : isDeepPocket
                            ? 'bg-amber-100 border border-amber-400 text-amber-700 hover:bg-amber-200'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {tooth % 10}
                  </button>
                )
              })}
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
              {[48, 47, 46, 45, 44, 43, 42, 41].map(tooth => {
                const isDisabled = disabledTeeth.has(tooth)
                const isSelected = selectedTeeth.has(tooth)
                const isDeepPocket = deepPocketTeethSet.has(tooth)
                return (
                  <button
                    key={tooth}
                    onClick={() => handleToothClick(tooth)}
                    onMouseDown={() => handleDragStart(tooth)}
                    onMouseEnter={() => handleDragEnter(tooth)}
                    onTouchStart={() => handleDragStart(tooth)}
                    disabled={isDisabled}
                    className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                      isDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-500 text-white'
                          : isDeepPocket
                            ? 'bg-amber-100 border border-amber-400 text-amber-700 hover:bg-amber-200'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {tooth % 10}
                  </button>
                )
              })}
              <div className="w-2" />
              {/* 左下 (31-38) */}
              {[31, 32, 33, 34, 35, 36, 37, 38].map(tooth => {
                const isDisabled = disabledTeeth.has(tooth)
                const isSelected = selectedTeeth.has(tooth)
                const isDeepPocket = deepPocketTeethSet.has(tooth)
                return (
                  <button
                    key={tooth}
                    onClick={() => handleToothClick(tooth)}
                    onMouseDown={() => handleDragStart(tooth)}
                    onMouseEnter={() => handleDragEnter(tooth)}
                    onTouchStart={() => handleDragStart(tooth)}
                    disabled={isDisabled}
                    className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                      isDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : isSelected
                          ? 'bg-blue-500 text-white'
                          : isDeepPocket
                            ? 'bg-amber-100 border border-amber-400 text-amber-700 hover:bg-amber-200'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {tooth % 10}
                  </button>
                )
              })}
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
                選択中({selectedTeeth.size}本)
              </div>
              <div className="text-sm text-gray-700">
                {Array.from(selectedTeeth)
                  .sort((a, b) => a - b)
                  .map(toothNumber => formatToothToPalmer(toothNumber))
                  .join(' ')}
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
            disabled={selectedTeeth.size === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            確定（{selectedTeeth.size}本）
          </Button>
        </div>
      </div>
    </div>
  )
}
