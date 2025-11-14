/**
 * 処置セット選択モーダル（Dentis風）
 * Treatment Set Selection Modal
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Check, Info } from 'lucide-react'
import {
  getTreatmentSetItems,
  type TreatmentSet,
  type TreatmentSetItem
} from '@/lib/api/treatment-sets'

interface TreatmentSetModalProps {
  isOpen: boolean
  onClose: () => void
  treatmentSet: TreatmentSet | null
  onApply: (selectedItems: TreatmentSetItem[]) => void
}

export function TreatmentSetModal({
  isOpen,
  onClose,
  treatmentSet,
  onApply
}: TreatmentSetModalProps) {
  const [items, setItems] = useState<TreatmentSetItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && treatmentSet) {
      loadSetItems()
    }
  }, [isOpen, treatmentSet])

  const loadSetItems = async () => {
    if (!treatmentSet) return

    setLoading(true)
    try {
      const data = await getTreatmentSetItems(treatmentSet.id)
      setItems(data)

      // デフォルトで選択状態の項目を設定
      const defaultSelected = new Set(
        data.filter(item => item.default_selected).map(item => item.id)
      )
      setSelectedItems(defaultSelected)
    } catch (error) {
      console.error('処置セット項目の読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleApply = () => {
    const selected = items.filter(item => selectedItems.has(item.id))
    onApply(selected)
    onClose()
  }

  const totalPoints = items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + (item.treatment?.points || 0), 0)

  if (!isOpen || !treatmentSet) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {treatmentSet.name}
            </h2>
            {treatmentSet.description && (
              <p className="text-sm text-gray-500 mt-1">
                {treatmentSet.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 説明文（Dentis風） */}
        <div className="px-4 py-3 bg-blue-50 border-b">
          <div className="flex items-start gap-2 text-sm text-blue-800">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              該当する処置を選択してください。チェックを入れた処置がカルテに追加されます。
            </p>
          </div>
        </div>

        {/* 処置リスト */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              読み込み中...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              処置が登録されていません
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${
                      selectedItems.has(item.id)
                        ? 'bg-blue-50 border-blue-500 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* チェックボックス */}
                    <div className="mt-0.5">
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${
                            selectedItems.has(item.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white border-gray-300'
                          }
                        `}
                      >
                        {selectedItems.has(item.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>

                    {/* 処置情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-medium text-gray-900">
                          {item.treatment?.name || item.treatment_code}
                        </h3>
                        <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                          {item.treatment?.points || 0}点
                        </span>
                      </div>

                      {item.treatment?.code && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.treatment.code}
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          💡 {item.notes}
                        </p>
                      )}

                      {item.is_required && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          必須
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">
              選択中: {selectedItems.size}件
            </div>
            <div className="text-lg font-semibold text-gray-900">
              合計 <span className="text-blue-600">{totalPoints}</span> 点
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleApply}
              disabled={selectedItems.size === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              適用（{selectedItems.size}件を追加）
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
