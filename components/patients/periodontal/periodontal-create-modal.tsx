'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { MeasurementType } from '@/lib/api/periodontal-exams'
import { PeriodontalMethodSelector } from './periodontal-method-selector'
import { PeriodontalInputForm, PeriodontalExamData } from './periodontal-input-form'

type Step = 'select-method' | 'input'

interface PeriodontalCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (measurementType: MeasurementType, data: PeriodontalExamData) => void
  initialData?: Partial<PeriodontalExamData>
  missingTeeth?: Set<number>
}

export function PeriodontalCreateModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  missingTeeth = new Set(),
}: PeriodontalCreateModalProps) {
  const [step, setStep] = useState<Step>('select-method')
  const [selectedMethod, setSelectedMethod] = useState<MeasurementType | null>(null)

  // 測定方式選択
  const handleMethodSelect = (method: MeasurementType) => {
    setSelectedMethod(method)
    setStep('input')
  }

  // 測定方式変更（Step 1に戻る）
  const handleChangeMethod = () => {
    setStep('select-method')
  }

  // キャンセル
  const handleCancel = () => {
    // ステップをリセット
    setStep('select-method')
    setSelectedMethod(null)
    onClose()
  }

  // 保存
  const handleSave = (data: PeriodontalExamData) => {
    if (!selectedMethod) return

    onSave(selectedMethod, data)

    // ステップをリセット
    setStep('select-method')
    setSelectedMethod(null)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="large"
      className="max-w-[90vw] max-h-[95vh]"
    >
      {step === 'select-method' ? (
        <PeriodontalMethodSelector
          onSelect={handleMethodSelect}
          onCancel={handleCancel}
        />
      ) : (
        selectedMethod && (
          <PeriodontalInputForm
            measurementType={selectedMethod}
            initialData={initialData}
            onSave={handleSave}
            onCancel={handleCancel}
            onChangeMethod={handleChangeMethod}
            missingTeeth={missingTeeth}
          />
        )
      )}
    </Modal>
  )
}
