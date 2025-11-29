'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { MeasurementType } from '@/lib/api/periodontal-exams'
import { PeriodontalInputForm, PeriodontalExamData } from './periodontal-input-form'
import type { PeriodontalExam } from '@/lib/api/periodontal-exams'

interface PeriodontalEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (examId: string, data: PeriodontalExamData) => void
  examination: PeriodontalExam | null
  missingTeeth: Set<number>
}

export function PeriodontalEditModal({
  isOpen,
  onClose,
  onSave,
  examination,
  missingTeeth,
}: PeriodontalEditModalProps) {
  const [initialData, setInitialData] = useState<Partial<PeriodontalExamData> | undefined>(undefined)

  useEffect(() => {
    if (!examination || !examination.tooth_data) {
      setInitialData(undefined)
      return
    }

    // 歯牙データをフォーム用のデータ構造に変換
    const ppdData: Record<string, number> = {}
    const bopData: Record<string, boolean> = {}
    const pusData: Record<string, boolean> = {}
    const plaqueData: Record<string, boolean> = {}
    const mobilityData: Record<string, number> = {}

    examination.tooth_data.forEach((tooth) => {
      // PPD
      if (tooth.ppd_mb) ppdData[`${tooth.tooth_number}_mb`] = tooth.ppd_mb
      if (tooth.ppd_b) ppdData[`${tooth.tooth_number}_b`] = tooth.ppd_b
      if (tooth.ppd_db) ppdData[`${tooth.tooth_number}_db`] = tooth.ppd_db
      if (tooth.ppd_ml) ppdData[`${tooth.tooth_number}_ml`] = tooth.ppd_ml
      if (tooth.ppd_l) ppdData[`${tooth.tooth_number}_l`] = tooth.ppd_l
      if (tooth.ppd_dl) ppdData[`${tooth.tooth_number}_dl`] = tooth.ppd_dl

      // BOP
      if (tooth.bop_mb) bopData[`${tooth.tooth_number}_mb`] = tooth.bop_mb
      if (tooth.bop_b) bopData[`${tooth.tooth_number}_b`] = tooth.bop_b
      if (tooth.bop_db) bopData[`${tooth.tooth_number}_db`] = tooth.bop_db
      if (tooth.bop_ml) bopData[`${tooth.tooth_number}_ml`] = tooth.bop_ml
      if (tooth.bop_l) bopData[`${tooth.tooth_number}_l`] = tooth.bop_l
      if (tooth.bop_dl) bopData[`${tooth.tooth_number}_dl`] = tooth.bop_dl

      // 排膿
      if (tooth.pus_mb) pusData[`${tooth.tooth_number}_mb`] = tooth.pus_mb
      if (tooth.pus_b) pusData[`${tooth.tooth_number}_b`] = tooth.pus_b
      if (tooth.pus_db) pusData[`${tooth.tooth_number}_db`] = tooth.pus_db
      if (tooth.pus_ml) pusData[`${tooth.tooth_number}_ml`] = tooth.pus_ml
      if (tooth.pus_l) pusData[`${tooth.tooth_number}_l`] = tooth.pus_l
      if (tooth.pus_dl) pusData[`${tooth.tooth_number}_dl`] = tooth.pus_dl

      // プラーク
      if (tooth.plaque_top) plaqueData[`${tooth.tooth_number}_top`] = tooth.plaque_top
      if (tooth.plaque_right) plaqueData[`${tooth.tooth_number}_right`] = tooth.plaque_right
      if (tooth.plaque_bottom) plaqueData[`${tooth.tooth_number}_bottom`] = tooth.plaque_bottom
      if (tooth.plaque_left) plaqueData[`${tooth.tooth_number}_left`] = tooth.plaque_left

      // 動揺度
      if (tooth.mobility) mobilityData[tooth.tooth_number] = tooth.mobility
    })

    setInitialData({
      ppdData,
      bopData,
      pusData,
      plaqueData,
      mobilityData,
      missingTeeth: new Set(missingTeeth),
    })
  }, [examination, missingTeeth])

  const handleSave = (data: PeriodontalExamData) => {
    if (!examination) return
    onSave(examination.id, data)
  }

  const handleCancel = () => {
    setInitialData(undefined)
    onClose()
  }

  if (!examination) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="large"
      className="max-w-[90vw] max-h-[95vh]"
    >
      <div className="p-6">
        {initialData && (
          <PeriodontalInputForm
            measurementType={examination.measurement_type}
            initialData={initialData}
            onSave={handleSave}
            onCancel={handleCancel}
            onChangeMethod={() => {}}
            missingTeeth={missingTeeth}
          />
        )}
      </div>
    </Modal>
  )
}
