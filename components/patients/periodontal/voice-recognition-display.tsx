'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Edit2, AlertTriangle } from 'lucide-react'
import type { ParsedValue, InputMode } from '@/lib/utils/voice-recognition-parser'

interface RecognizedEntry {
  id: string
  mode: InputMode
  toothNumber?: number
  position?: string
  value: number | boolean
  confidence: number
  rawToken: string
  confirmed: boolean
  edited: boolean
}

interface VoiceRecognitionDisplayProps {
  entries: RecognizedEntry[]
  onConfirm: (id: string) => void
  onEdit: (id: string, newValue: number | boolean) => void
  onDelete: (id: string) => void
  onConfirmAll: () => void
  onClearAll: () => void
}

export function VoiceRecognitionDisplay({
  entries,
  onConfirm,
  onEdit,
  onDelete,
  onConfirmAll,
  onClearAll,
}: VoiceRecognitionDisplayProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const handleEditStart = (entry: RecognizedEntry) => {
    setEditingId(entry.id)
    setEditValue(String(entry.value))
  }

  const handleEditSave = (id: string) => {
    const num = parseInt(editValue, 10)
    if (!isNaN(num)) {
      onEdit(id, num)
    }
    setEditingId(null)
    setEditValue('')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  // 信頼度に応じた色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 border-green-300 text-green-800'
    if (confidence >= 0.7) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    return 'bg-red-100 border-red-300 text-red-800'
  }

  // モードアイコン
  const getModeIcon = (mode: InputMode) => {
    switch (mode) {
      case 'ppd':
        return '📏'
      case 'bop':
        return '🔴'
      case 'mobility':
        return '↔️'
    }
  }

  // エントリーの表示テキスト
  const getEntryDisplayText = (entry: RecognizedEntry) => {
    if (entry.mode === 'ppd') {
      if (entry.toothNumber && entry.position) {
        return `${entry.toothNumber}番 ${entry.position}: ${entry.value}mm`
      }
      return `${entry.value}mm`
    } else if (entry.mode === 'bop') {
      return `${entry.toothNumber}番: BOP(+)`
    } else if (entry.mode === 'mobility') {
      return `${entry.toothNumber}番: ${entry.value}度`
    }
    return entry.rawToken
  }

  const unconfirmedCount = entries.filter(e => !e.confirmed).length
  const lowConfidenceCount = entries.filter(e => e.confidence < 0.7).length

  if (entries.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-sm text-gray-500">認識結果がここに表示されます</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">認識結果</h3>
          <p className="text-xs text-gray-500">
            {entries.length}件のデータ
            {unconfirmedCount > 0 && ` (未確認: ${unconfirmedCount})`}
            {lowConfidenceCount > 0 && (
              <span className="text-red-600 ml-2">
                ⚠️ 信頼度が低いデータ: {lowConfidenceCount}件
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onConfirmAll}
            variant="default"
            size="sm"
            disabled={unconfirmedCount === 0}
          >
            <Check className="w-4 h-4 mr-1" />
            全て確定
          </Button>
          <Button
            onClick={onClearAll}
            variant="outline"
            size="sm"
          >
            <X className="w-4 h-4 mr-1" />
            クリア
          </Button>
        </div>
      </div>

      {/* エントリーリスト */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-center justify-between p-3 rounded-md border ${
              entry.confirmed
                ? 'bg-gray-50 border-gray-200'
                : getConfidenceColor(entry.confidence)
            }`}
          >
            <div className="flex items-center space-x-3 flex-1">
              {/* モードアイコン */}
              <span className="text-lg">{getModeIcon(entry.mode)}</span>

              {/* データ表示 */}
              <div className="flex-1">
                {editingId === entry.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      min="0"
                      max="15"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleEditSave(entry.id)}
                      variant="default"
                      size="sm"
                      className="h-7"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={handleEditCancel}
                      variant="outline"
                      size="sm"
                      className="h-7"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">
                      {getEntryDisplayText(entry)}
                      {entry.edited && (
                        <span className="ml-2 text-xs text-blue-600">(編集済み)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      認識: 「{entry.rawToken}」
                      <span className="ml-2">
                        信頼度: {(entry.confidence * 100).toFixed(0)}%
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* アクション */}
              <div className="flex items-center space-x-1">
                {!entry.confirmed && entry.confidence < 0.7 && (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}

                {editingId !== entry.id && (
                  <>
                    {!entry.confirmed ? (
                      <Button
                        onClick={() => onConfirm(entry.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="確定"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                    ) : (
                      <div className="flex items-center text-green-600">
                        <Check className="w-4 h-4" />
                      </div>
                    )}

                    {entry.mode === 'ppd' && (
                      <Button
                        onClick={() => handleEditStart(entry)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="編集"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                    )}

                    <Button
                      onClick={() => onDelete(entry.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="削除"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
