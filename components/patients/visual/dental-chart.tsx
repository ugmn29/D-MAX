'use client'

import { DentalChartTable } from './dental-chart-table'
import type { VisualToothData } from '@/lib/api/visual-exams'

interface DentalChartProps {
  toothData: Record<number, VisualToothData>
  selectedTeeth: Set<number>
  onToothClick: (toothNumber: number) => void
}

export function DentalChart({ toothData, selectedTeeth, onToothClick }: DentalChartProps) {
  return (
    <DentalChartTable toothData={toothData} selectedTeeth={selectedTeeth} onToothClick={onToothClick} />
  )
}
