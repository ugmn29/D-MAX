'use client'

import { ToothOverlay } from './tooth-overlay'
import { getToothPosition } from './tooth-positions'
import type { ToothStatus, CariesLevel, RestorationType, MaterialType } from '@/lib/api/visual-exams'

interface ToothCellProps {
  toothNumber: number
  status?: ToothStatus
  cariesLevel?: CariesLevel
  restorationType?: RestorationType
  materialType?: MaterialType
  isSelected: boolean
  onClick: () => void
}

export function ToothCell({
  toothNumber,
  status = 'healthy',
  cariesLevel,
  restorationType,
  materialType,
  isSelected,
  onClick,
}: ToothCellProps) {
  const position = getToothPosition(toothNumber)

  if (!position) {
    console.error(`Position not found for tooth ${toothNumber}`)
    return null
  }

  return (
    <div
      className="absolute cursor-pointer transition-all hover:opacity-80"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
      }}
      onClick={onClick}
    >
      {/* 選択状態の表示 */}
      {isSelected && (
        <div className="absolute inset-0 border-4 border-blue-500 rounded-md pointer-events-none z-10" />
      )}

      {/* 状態に応じた色付きオーバーレイ */}
      <ToothOverlay
        status={status}
        cariesLevel={cariesLevel}
        restorationType={restorationType}
        materialType={materialType}
      />

      {/* ホバー時のハイライト */}
      <div className="absolute inset-0 hover:bg-blue-200 hover:bg-opacity-20 rounded-sm transition-colors" />
    </div>
  )
}
