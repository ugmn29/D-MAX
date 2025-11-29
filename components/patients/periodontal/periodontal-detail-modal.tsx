'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { PeriodontalGrid } from './periodontal-grid'
import type { PeriodontalExam } from '@/lib/api/periodontal-exams'
import { Calendar } from 'lucide-react'

interface PeriodontalDetailModalProps {
  isOpen: boolean
  onClose: () => void
  examination: PeriodontalExam | null
  missingTeeth: Set<number>
}

export function PeriodontalDetailModal({
  isOpen,
  onClose,
  examination,
  missingTeeth,
}: PeriodontalDetailModalProps) {
  if (!examination) return null

  // 歯牙データをPPDデータ、BOP等に変換
  const ppdData: Record<string, number> = {}
  const bopData: Record<string, boolean> = {}
  const pusData: Record<string, boolean> = {}
  const plaqueData: Record<string, boolean> = {}
  const mobilityData: Record<string, number> = {}

  examination.tooth_data?.forEach((tooth) => {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" className="max-w-[98vw] h-[92vh]">
      <div className="h-full flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-4">
          {/* ヘッダー */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              歯周検査 - 詳細 ({examination.measurement_type === '1point' ? '1点法' : examination.measurement_type === '4point' ? '4点法' : '6点法'})
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(examination.examination_date).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* 歯周検査グリッド（読み取り専用） */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">検査結果</h3>
            <PeriodontalGrid
              measurementType={examination.measurement_type}
              ppdData={ppdData}
              mobilityData={mobilityData}
              plaqueData={plaqueData}
              bopData={bopData}
              missingTeeth={missingTeeth}
              currentPosition={{ row: -1, toothIndex: -1, point: -1 }} // 選択なし
              onCellClick={() => {}} // 読み取り専用
              onPlaqueToggle={() => {}} // 読み取り専用
            />
          </div>

          {/* メモ */}
          {examination.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">メモ</h3>
              <div className="whitespace-pre-wrap text-gray-700">{examination.notes}</div>
            </div>
          )}
        </div>

        {/* ボタン */}
        <div className="absolute bottom-0 right-0 flex items-center justify-end p-4 bg-white border-t">
          <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
            閉じる
          </Button>
        </div>
      </div>
    </Modal>
  )
}
