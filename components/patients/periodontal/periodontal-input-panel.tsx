'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'

interface PeriodontalInputPanelProps {
  onNumberInput: (value: number) => void
  onSpecialInput: (type: 'bop' | 'pus' | 'skip') => void
  onNavigate: (direction: 'left' | 'right' | 'up' | 'down') => void
  bopMode: boolean
  pusMode: boolean
  onToggleBopMode: () => void
  onTogglePusMode: () => void
  onBulkFillPpd?: (value: number) => void
  onBulkFillMobility?: (value: number) => void
}

export function PeriodontalInputPanel({
  onNumberInput,
  onSpecialInput,
  onNavigate,
  bopMode,
  pusMode,
  onToggleBopMode,
  onTogglePusMode,
  onBulkFillPpd,
  onBulkFillMobility,
}: PeriodontalInputPanelProps) {

  // 数値ボタン（1-15）
  const numberButtons = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
    { label: '6', value: 6 },
    { label: '7', value: 7 },
    { label: '8', value: 8 },
    { label: '9', value: 9 },
    { label: '10', value: 10 },
    { label: '11', value: 11 },
    { label: '12', value: 12 },
    { label: '13', value: 13 },
    { label: '14', value: 14 },
    { label: '15', value: 15 },
  ]

  return (
    <div className="bg-slate-700 rounded-lg p-5 flex gap-4 h-[280px]">
      {/* 一括入力セクション */}
      {(onBulkFillPpd || onBulkFillMobility) && (
        <div className="bg-slate-800 rounded-md p-3 space-y-2 w-[220px] flex-shrink-0 overflow-hidden">
          <h3 className="text-white text-sm font-semibold">📋 一括入力</h3>

          {/* PPD一括入力 */}
          {onBulkFillPpd && (
            <div>
              <p className="text-white text-xs mb-1">PPD</p>
              <div className="grid grid-cols-3 gap-1.5">
                {[3, 4, 5].map((value) => (
                  <button
                    key={`ppd-bulk-${value}`}
                    onClick={() => onBulkFillPpd(value)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-3 rounded transition-colors"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 動揺度一括入力 */}
          {onBulkFillMobility && (
            <div>
              <p className="text-white text-xs mb-1">動揺度</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[0, 1].map((value) => (
                  <button
                    key={`mobility-bulk-${value}`}
                    onClick={() => onBulkFillMobility(value)}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xl font-bold py-3 rounded transition-colors"
                  >
                    {value}度
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 数値ボタン 1-15 + 特殊ボタン（9列×2行） */}
      <div className="grid grid-cols-9 gap-4 flex-1 grid-rows-2">
        {/* 1行目: 出血 + 1-8 */}
        <button
          onClick={onToggleBopMode}
          className={`text-white text-2xl font-bold rounded transition-colors ${
            bopMode
              ? 'bg-red-700 ring-4 ring-red-300'
              : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          出血
        </button>
        {numberButtons.slice(0, 8).map((btn) => (
          <button
            key={btn.value}
            onClick={() => onNumberInput(btn.value)}
            className="bg-slate-600 hover:bg-slate-500 text-white text-6xl font-bold rounded transition-colors"
          >
            {btn.label}
          </button>
        ))}

        {/* 2行目: 排膿 + 9-15 */}
        <button
          onClick={onTogglePusMode}
          className={`text-white text-2xl font-bold rounded transition-colors ${
            pusMode
              ? 'bg-yellow-700 ring-4 ring-yellow-300'
              : 'bg-yellow-600 hover:bg-yellow-500'
          }`}
        >
          排膿
        </button>
        {numberButtons.slice(8).map((btn) => (
          <button
            key={btn.value}
            onClick={() => onNumberInput(btn.value)}
            className="bg-slate-600 hover:bg-slate-500 text-white text-6xl font-bold rounded transition-colors"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
