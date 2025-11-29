'use client'

import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { DentalChart } from './dental-chart'
import type { VisualExamination } from '@/lib/api/visual-exams'
import { Calendar, FileText } from 'lucide-react'

interface VisualExamDetailModalProps {
  isOpen: boolean
  onClose: () => void
  examination: VisualExamination | null
}

export function VisualExamDetailModal({ isOpen, onClose, examination }: VisualExamDetailModalProps) {
  if (!examination) return null

  // FDI歯番号を表示用文字列に変換
  const toothNumberToDisplay = (toothNumber: number): string => {
    // 乳歯のマッピング
    const deciduousMap: Record<number, string> = {
      55: 'E', 54: 'D', 53: 'C', 52: 'B', 51: 'A',
      61: 'A', 62: 'B', 63: 'C', 64: 'D', 65: 'E',
      85: 'E', 84: 'D', 83: 'C', 82: 'B', 81: 'A',
      71: 'A', 72: 'B', 73: 'C', 74: 'D', 75: 'E',
    }

    if (deciduousMap[toothNumber]) {
      return `乳歯${deciduousMap[toothNumber]}`
    }

    // 永久歯は番号で表示
    return `#${toothNumber}`
  }

  // 歯牙データをマップ形式に変換
  const toothDataMap: Record<number, any> = {}
  examination.tooth_data?.forEach(tooth => {
    toothDataMap[tooth.tooth_number] = tooth
  })

  // サマリー情報を計算
  const toothData = examination.tooth_data || []
  const cariesCount = toothData.filter(t => t.status === 'caries').length
  const restorationCount = toothData.filter(t => t.status === 'restoration').length
  const missingCount = toothData.filter(t => t.status === 'missing').length
  const extractionRequiredCount = toothData.filter(t => t.status === 'extraction_required').length
  const healthyCount = toothData.filter(t => t.status === 'healthy').length

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" className="max-w-[98vw] h-[92vh]">
      <div className="h-full flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-4">
        {/* ヘッダー */}
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">視診検査 - 詳細</h2>
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

        {/* 歯列図（読み取り専用） */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">歯列図</h3>
          <DentalChart
            toothData={toothDataMap}
            selectedTeeth={new Set()}
            onToothClick={() => {}} // 読み取り専用
          />
        </div>

        {/* サマリー情報 */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">検査サマリー</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
              <div className="text-sm text-gray-600">健全</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{cariesCount}</div>
              <div className="text-sm text-gray-600">う蝕</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{restorationCount}</div>
              <div className="text-sm text-gray-600">処置済</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-600">{missingCount}</div>
              <div className="text-sm text-gray-600">欠損</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{extractionRequiredCount}</div>
              <div className="text-sm text-gray-600">要抜歯</div>
            </div>
          </div>
        </div>

        {/* メモ */}
        {examination.notes && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">メモ</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {examination.notes}
            </div>
          </div>
        )}

      </div>

      {/* ボタン（右下端に絶対配置） */}
      <div className="absolute bottom-0 right-0 flex items-center justify-end p-4 bg-white">
        <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
          閉じる
        </Button>
      </div>
      </div>
    </Modal>
  )
}
