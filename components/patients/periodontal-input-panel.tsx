'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'

interface PeriodontalInputPanelProps {
  onNumberInput: (value: number) => void
  onSpecialInput: (type: 'bop' | 'pus' | 'skip') => void
  onNavigate: (direction: 'left' | 'right' | 'up' | 'down') => void
}

export function PeriodontalInputPanel({
  onNumberInput,
  onSpecialInput,
  onNavigate,
}: PeriodontalInputPanelProps) {

  // 数値ボタン（0-15）
  const numberButtons = [
    { label: '0', value: 0 },
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
    <div className="bg-slate-700 rounded-lg p-6 space-y-4">
      {/* ポケット深さ入力 */}
      <div>
        <div className="bg-blue-600 text-white text-sm font-bold mb-2 px-3 py-2 rounded">ポケット</div>
        <div className="grid grid-cols-10 gap-2">
          {/* 0-9 */}
          {numberButtons.slice(0, 10).map((btn) => (
            <button
              key={btn.value}
              onClick={() => onNumberInput(btn.value)}
              className="bg-slate-600 hover:bg-slate-500 text-white text-2xl font-bold py-5 rounded transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 出血 */}
      <div>
        <div className="bg-slate-600 text-white text-sm font-bold mb-2 px-3 py-2 rounded">出血</div>
        <div className="grid grid-cols-9 gap-2">
          {/* 10-15 */}
          {numberButtons.slice(10).map((btn) => (
            <button
              key={btn.value}
              onClick={() => onNumberInput(btn.value)}
              className="bg-slate-600 hover:bg-slate-500 text-white text-lg font-bold py-4 rounded transition-colors"
            >
              {btn.label}
            </button>
          ))}

          {/* スキップ */}
          <button
            onClick={() => onSpecialInput('skip')}
            className="bg-slate-600 hover:bg-slate-500 text-white text-xl font-bold py-4 rounded transition-colors"
          >
            -
          </button>

          {/* 出血ボタン */}
          <button
            onClick={() => onSpecialInput('bop')}
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-4 px-3 rounded transition-colors"
          >
            出血
          </button>

          {/* 排膿ボタン */}
          <button
            onClick={() => onSpecialInput('pus')}
            className="bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold py-4 px-3 rounded transition-colors"
          >
            排膿
          </button>
        </div>
      </div>

      {/* 排膿（独立行） */}
      <div>
        <div className="bg-slate-600 text-white text-sm font-bold mb-2 px-3 py-2 rounded">排膿</div>
      </div>

      {/* ナビゲーション */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <button
          onClick={() => onNavigate('left')}
          className="bg-slate-600 hover:bg-slate-500 text-white py-5 rounded transition-colors flex items-center justify-center text-2xl font-bold"
        >
          ◀
        </button>

        <button
          onClick={() => onNavigate('up')}
          className="bg-slate-600 hover:bg-slate-500 text-white py-5 rounded transition-colors flex items-center justify-center text-2xl font-bold"
        >
          ▲
        </button>

        <button
          onClick={() => onNavigate('right')}
          className="bg-slate-600 hover:bg-slate-500 text-white py-5 rounded transition-colors flex items-center justify-center text-2xl font-bold"
        >
          ▶
        </button>

        <div></div>

        <button
          onClick={() => onNavigate('down')}
          className="bg-slate-600 hover:bg-slate-500 text-white py-5 rounded transition-colors flex items-center justify-center text-2xl font-bold"
        >
          ▼
        </button>

        <div></div>
      </div>
    </div>
  )
}
