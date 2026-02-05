'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { calculateBmi } from '@/lib/api/mft-measurements'
import type { MftMeasurement } from '@/lib/api/mft-measurements'

interface MftMeasurementFormProps {
  measurement?: MftMeasurement | null
  onSave: (data: MftMeasurementFormData) => void
  onCancel: () => void
}

export interface MftMeasurementFormData {
  measurement_date: string
  height?: number | null
  weight?: number | null
  lip_seal_strength?: number | null
  tongue_pressure?: number | null
  max_mouth_opening?: number | null
  notes?: string
}

export function MftMeasurementForm({
  measurement,
  onSave,
  onCancel,
}: MftMeasurementFormProps) {
  const [formData, setFormData] = useState<MftMeasurementFormData>({
    measurement_date: measurement?.measurement_date || new Date().toISOString().split('T')[0],
    height: measurement?.height || null,
    weight: measurement?.weight || null,
    lip_seal_strength: measurement?.lip_seal_strength || null,
    tongue_pressure: measurement?.tongue_pressure || null,
    max_mouth_opening: measurement?.max_mouth_opening || null,
    notes: measurement?.notes || '',
  })

  const [bmi, setBmi] = useState<number | null>(null)

  // BMIを自動計算
  useEffect(() => {
    const calculated = calculateBmi(formData.height, formData.weight)
    setBmi(calculated)
  }, [formData.height, formData.weight])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', formData)
    onSave(formData)
  }

  const handleNumberChange = (field: keyof MftMeasurementFormData, value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    if (value !== '' && isNaN(numValue as number)) {
      return // 無効な数値の場合は更新しない
    }
    setFormData((prev) => ({ ...prev, [field]: numValue }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 測定日 */}
        <div>
          <Label htmlFor="measurement_date">測定日 *</Label>
          <Input
            id="measurement_date"
            type="date"
            value={formData.measurement_date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, measurement_date: e.target.value }))
            }
            required
          />
        </div>

        <div /> {/* 空白 */}

        {/* 身長 */}
        <div>
          <Label htmlFor="height">身長（cm）</Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            min="0"
            max="300"
            value={formData.height !== null && formData.height !== undefined ? formData.height : ''}
            onChange={(e) => handleNumberChange('height', e.target.value)}
            placeholder="例: 150.5"
          />
        </div>

        {/* 体重 */}
        <div>
          <Label htmlFor="weight">体重（kg）</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="0"
            max="500"
            value={formData.weight !== null && formData.weight !== undefined ? formData.weight : ''}
            onChange={(e) => handleNumberChange('weight', e.target.value)}
            placeholder="例: 45.5"
          />
        </div>

        {/* BMI（表示のみ） */}
        <div>
          <Label>BMI</Label>
          <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
            {bmi !== null ? bmi.toFixed(1) : '—'}
          </div>
        </div>

        <div /> {/* 空白 */}

        {/* 口輪筋力 */}
        <div>
          <Label htmlFor="lip_seal_strength">口輪筋力（g）</Label>
          <Input
            id="lip_seal_strength"
            type="number"
            step="0.1"
            min="0"
            value={formData.lip_seal_strength !== null && formData.lip_seal_strength !== undefined ? formData.lip_seal_strength : ''}
            onChange={(e) => handleNumberChange('lip_seal_strength', e.target.value)}
            placeholder="例: 500.0"
          />
        </div>

        {/* 舌圧 */}
        <div>
          <Label htmlFor="tongue_pressure">舌圧（kPa）</Label>
          <Input
            id="tongue_pressure"
            type="number"
            step="0.1"
            min="0"
            value={formData.tongue_pressure !== null && formData.tongue_pressure !== undefined ? formData.tongue_pressure : ''}
            onChange={(e) => handleNumberChange('tongue_pressure', e.target.value)}
            placeholder="例: 30.5"
          />
        </div>

        {/* 最大開口量 */}
        <div>
          <Label htmlFor="max_mouth_opening">最大開口量（mm）</Label>
          <Input
            id="max_mouth_opening"
            type="number"
            step="0.1"
            min="0"
            value={formData.max_mouth_opening !== null && formData.max_mouth_opening !== undefined ? formData.max_mouth_opening : ''}
            onChange={(e) => handleNumberChange('max_mouth_opening', e.target.value)}
            placeholder="例: 45.0"
          />
        </div>
      </div>

      {/* 備考 */}
      <div>
        <Label htmlFor="notes">備考</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="特記事項があれば記入してください"
          rows={3}
        />
      </div>

      {/* ボタン */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          保存
        </Button>
      </div>
    </form>
  )
}
