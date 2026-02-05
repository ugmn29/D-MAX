'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { MftMeasurement } from '@/lib/api/mft-measurements'

interface MftMeasurementListProps {
  measurements: MftMeasurement[]
  onEdit: (measurement: MftMeasurement) => void
  onDelete: (id: string) => void
}

export function MftMeasurementList({
  measurements,
  onEdit,
  onDelete,
}: MftMeasurementListProps) {
  if (measurements.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>測定記録がありません</p>
        <p className="text-sm mt-2">「新規記録」ボタンから記録を追加してください</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">測定日</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              身長<br />(cm)
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              体重<br />(kg)
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">BMI</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              口輪筋力<br />(g)
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              舌圧<br />(kPa)
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              最大開口量<br />(mm)
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">備考</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((measurement) => (
            <tr
              key={measurement.id}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDate(measurement.measurement_date)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {measurement.height !== null ? measurement.height.toFixed(1) : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {measurement.weight !== null ? measurement.weight.toFixed(1) : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {measurement.bmi !== null ? measurement.bmi.toFixed(1) : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {measurement.lip_seal_strength !== null
                  ? measurement.lip_seal_strength.toFixed(1)
                  : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {measurement.tongue_pressure !== null
                  ? measurement.tongue_pressure.toFixed(1)
                  : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                {measurement.max_mouth_opening !== null
                  ? measurement.max_mouth_opening.toFixed(1)
                  : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                <div className="max-w-xs truncate" title={measurement.notes || ''}>
                  {measurement.notes || '—'}
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(measurement)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          `${formatDate(measurement.measurement_date)}の記録を削除してもよろしいですか？`
                        )
                      ) {
                        onDelete(measurement.id)
                      }
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
