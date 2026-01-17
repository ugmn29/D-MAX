'use client'

import { DentalChartTable } from './dental-chart-table'
import type { VisualToothData } from '@/lib/api/visual-exams'

interface DentalChartProps {
  toothData: Record<number, VisualToothData>
  selectedTeeth: Set<number>
  onToothClick: (toothNumber: number) => void
  disabledTeeth?: Set<number>  // 選択不可の歯（グレーアウト表示）
}

export function DentalChart({ toothData, selectedTeeth, onToothClick, disabledTeeth }: DentalChartProps) {
  return (
    <DentalChartTable toothData={toothData} selectedTeeth={selectedTeeth} onToothClick={onToothClick} disabledTeeth={disabledTeeth} />
  )
}
