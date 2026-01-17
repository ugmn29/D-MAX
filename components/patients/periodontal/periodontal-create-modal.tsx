'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { MeasurementType, ExaminationPhase } from '@/lib/api/periodontal-exams'
import { PeriodontalMethodSelector } from './periodontal-method-selector'
import { PeriodontalInputForm, PeriodontalExamData } from './periodontal-input-form'

type Step = 'select-method' | 'input'

interface PeriodontalCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (measurementType: MeasurementType, data: PeriodontalExamData, examinationPhase?: ExaminationPhase) => void
  initialData?: Partial<PeriodontalExamData>
  missingTeeth?: Set<number>
  patientId?: string
}

export function PeriodontalCreateModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  missingTeeth = new Set(),
  patientId,
}: PeriodontalCreateModalProps) {
  const [step, setStep] = useState<Step>('select-method')
  const [selectedMethod, setSelectedMethod] = useState<MeasurementType | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<ExaminationPhase | undefined>(undefined)

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
    setSelectedPhase(undefined)
    onClose()
  }

  // 保存
  const handleSave = (data: PeriodontalExamData) => {
    if (!selectedMethod) return

    onSave(selectedMethod, data, selectedPhase)

    // ステップをリセット
    setStep('select-method')
    setSelectedMethod(null)
    setSelectedPhase(undefined)
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
            selectedPhase={selectedPhase}
            onPhaseChange={setSelectedPhase}
            patientId={patientId}
          />
        )
      )}
    </Modal>
  )
}
