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
}

export function PeriodontalInputPanel({
  onNumberInput,
  onSpecialInput,
  onNavigate,
  bopMode,
  pusMode,
  onToggleBopMode,
  onTogglePusMode,
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
    <div className="bg-slate-700 rounded-lg p-6">
      {/* 数値ボタン 1-15 + 特殊ボタン（9列×2行） */}
      <div className="grid grid-cols-9 gap-3">
        {/* 1行目: 出血 + 1-8 */}
        <button
          onClick={onToggleBopMode}
          className={`text-white text-xl font-bold py-8 rounded transition-colors ${
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
            className="bg-slate-600 hover:bg-slate-500 text-white text-3xl font-bold py-8 rounded transition-colors"
          >
            {btn.label}
          </button>
        ))}

        {/* 2行目: 排膿 + 9-15 */}
        <button
          onClick={onTogglePusMode}
          className={`text-white text-xl font-bold py-8 rounded transition-colors ${
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
            className="bg-slate-600 hover:bg-slate-500 text-white text-3xl font-bold py-8 rounded transition-colors"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
