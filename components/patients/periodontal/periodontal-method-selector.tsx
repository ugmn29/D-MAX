'use client'

import { MeasurementType } from '@/lib/api/periodontal-exams'

interface PeriodontalMethodSelectorProps {
  onSelect: (method: MeasurementType) => void
  onCancel: () => void
}

export function PeriodontalMethodSelector({
  onSelect,
  onCancel,
}: PeriodontalMethodSelectorProps) {
  const methods: { value: MeasurementType; label: string }[] = [
    { value: '6point', label: '6点法' },
    { value: '4point', label: '4点法' },
    { value: '1point', label: '1点法' },
  ]

  return (
    <div className="p-8">
      <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
        測定方式を選択してください
      </h3>

      <div className="space-y-4 max-w-md mx-auto">
        {methods.map((method) => (
          <button
            key={method.value}
            onClick={() => onSelect(method.value)}
            className="w-full bg-white border-2 border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span className="text-2xl font-bold text-gray-900">{method.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
