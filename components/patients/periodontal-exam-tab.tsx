'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Activity, Plus } from 'lucide-react'
import { PeriodontalExamList } from './periodontal/periodontal-exam-list'
import { PeriodontalCreateModal } from './periodontal/periodontal-create-modal'
import { PeriodontalDetailModal } from './periodontal/periodontal-detail-modal'
import { PeriodontalEditModal } from './periodontal/periodontal-edit-modal'
import { PeriodontalExamData } from './periodontal/periodontal-input-form'
import {
  getPeriodontalExams,
  getPeriodontalExam,
  createPeriodontalExam,
  updatePeriodontalExam,
  deletePeriodontalExam,
  MeasurementType,
  ExaminationPhase,
  PeriodontalExam,
  PeriodontalToothData,
} from '@/lib/api/periodontal-exams'
import { getMissingTeeth } from '@/lib/api/visual-exams'
import { getClinicId } from '@/lib/utils/get-clinic'

interface PeriodontalExamTabProps {
  patientId: string
}

// FDI歯番号の全リスト
const ALL_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
]

// 親知らず（デフォルトで除外する歯）
const WISDOM_TEETH = [18, 28, 38, 48]

export function PeriodontalExamTab({ patientId }: PeriodontalExamTabProps) {
  const [exams, setExams] = useState<PeriodontalExam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<PeriodontalExam | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missingTeeth, setMissingTeeth] = useState<Set<number>>(new Set())

  // 検査履歴を読み込む
  const loadExams = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getPeriodontalExams(patientId)
      setExams(data)
    } catch (err) {
      console.error('Failed to load periodontal exams:', err)
      setError('検査履歴の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 視診データから欠損歯を読み込む
  const loadMissingTeeth = async () => {
    try {
      const missing = await getMissingTeeth(patientId)
      // 親知らずをデフォルトで欠損歯として追加
      const combined = new Set(missing)
      WISDOM_TEETH.forEach(tooth => combined.add(tooth))
      setMissingTeeth(combined)
    } catch (err) {
      console.error('Failed to load missing teeth:', err)
    }
  }

  useEffect(() => {
    loadExams()
    loadMissingTeeth()
  }, [patientId])

  // 新規検査を保存
  const handleSaveExam = async (measurementType: MeasurementType, data: PeriodontalExamData, examinationPhase?: ExaminationPhase) => {
    try {
      const clinicId = getClinicId()

      // データを変換
      const toothDataList: PeriodontalToothData[] = ALL_TEETH.map(toothNumber => {
        const isMissing = data.missingTeeth.has(toothNumber)

        // プラークデータを取得
        const plaqueTop = data.plaqueData[`${toothNumber}_top`] || false
        const plaqueRight = data.plaqueData[`${toothNumber}_right`] || false
        const plaqueBottom = data.plaqueData[`${toothNumber}_bottom`] || false
        const plaqueLeft = data.plaqueData[`${toothNumber}_left`] || false

        // PPDデータを取得
        const ppd_mb = data.ppdData[`${toothNumber}_mb`]
        const ppd_b = data.ppdData[`${toothNumber}_b`]
        const ppd_db = data.ppdData[`${toothNumber}_db`]
        const ppd_ml = data.ppdData[`${toothNumber}_ml`]
        const ppd_l = data.ppdData[`${toothNumber}_l`]
        const ppd_dl = data.ppdData[`${toothNumber}_dl`]

        // BOPデータを取得
        const bop_mb = data.bopData[`${toothNumber}_mb`] || false
        const bop_b = data.bopData[`${toothNumber}_b`] || false
        const bop_db = data.bopData[`${toothNumber}_db`] || false
        const bop_ml = data.bopData[`${toothNumber}_ml`] || false
        const bop_l = data.bopData[`${toothNumber}_l`] || false
        const bop_dl = data.bopData[`${toothNumber}_dl`] || false

        // 排膿データを取得
        const pus_mb = data.pusData[`${toothNumber}_mb`] || false
        const pus_b = data.pusData[`${toothNumber}_b`] || false
        const pus_db = data.pusData[`${toothNumber}_db`] || false
        const pus_ml = data.pusData[`${toothNumber}_ml`] || false
        const pus_l = data.pusData[`${toothNumber}_l`] || false
        const pus_dl = data.pusData[`${toothNumber}_dl`] || false

        // 動揺度を取得
        const mobility = data.mobilityData[toothNumber]

        return {
          tooth_number: toothNumber,
          plaque_top: plaqueTop,
          plaque_right: plaqueRight,
          plaque_bottom: plaqueBottom,
          plaque_left: plaqueLeft,
          is_missing: isMissing,
          mobility,
          ppd_mb,
          ppd_b,
          ppd_db,
          ppd_ml,
          ppd_l,
          ppd_dl,
          bop_mb,
          bop_b,
          bop_db,
          bop_ml,
          bop_l,
          bop_dl,
          pus_mb,
          pus_b,
          pus_db,
          pus_ml,
          pus_l,
          pus_dl,
        }
      })

      await createPeriodontalExam({
        patient_id: patientId,
        clinic_id: clinicId,
        measurement_type: measurementType,
        examination_phase: examinationPhase,
        tooth_data: toothDataList,
      })

      // 成功したらモーダルを閉じて一覧を再読み込み
      setIsCreateModalOpen(false)
      await loadExams()
    } catch (err) {
      console.error('Failed to save periodontal exam:', err)
      alert('検査の保存に失敗しました')
    }
  }

  // 検査を削除
  const handleDeleteExam = async (examId: string) => {
    if (!confirm('この検査を削除してもよろしいですか？')) {
      return
    }

    try {
      await deletePeriodontalExam(examId)
      await loadExams()
    } catch (err) {
      console.error('Failed to delete periodontal exam:', err)
      alert('検査の削除に失敗しました')
    }
  }

  // 詳細表示
  const handleViewExam = async (examId: string) => {
    try {
      // APIから歯牙データを含めて取得
      const exam = await getPeriodontalExam(examId)
      setSelectedExam(exam)
      setIsDetailModalOpen(true)
    } catch (error) {
      console.error('Failed to view exam:', error)
      alert('検査の表示に失敗しました')
    }
  }

  // 編集
  const handleEditExam = async (examId: string) => {
    try {
      // APIから歯牙データを含めて取得
      const exam = await getPeriodontalExam(examId)
      setSelectedExam(exam)
      setIsEditModalOpen(true)
    } catch (error) {
      console.error('Failed to load exam for editing:', error)
      alert('検査の読み込みに失敗しました')
    }
  }

  // 検査を更新
  const handleUpdateExam = async (examId: string, data: PeriodontalExamData) => {
    try {
      // データを変換
      const toothDataList: PeriodontalToothData[] = ALL_TEETH.map(toothNumber => {
        const isMissing = data.missingTeeth.has(toothNumber)

        // プラークデータを取得
        const plaqueTop = data.plaqueData[`${toothNumber}_top`] || false
        const plaqueRight = data.plaqueData[`${toothNumber}_right`] || false
        const plaqueBottom = data.plaqueData[`${toothNumber}_bottom`] || false
        const plaqueLeft = data.plaqueData[`${toothNumber}_left`] || false

        // PPDデータを取得
        const ppd_mb = data.ppdData[`${toothNumber}_mb`]
        const ppd_b = data.ppdData[`${toothNumber}_b`]
        const ppd_db = data.ppdData[`${toothNumber}_db`]
        const ppd_ml = data.ppdData[`${toothNumber}_ml`]
        const ppd_l = data.ppdData[`${toothNumber}_l`]
        const ppd_dl = data.ppdData[`${toothNumber}_dl`]

        // BOPデータを取得
        const bop_mb = data.bopData[`${toothNumber}_mb`] || false
        const bop_b = data.bopData[`${toothNumber}_b`] || false
        const bop_db = data.bopData[`${toothNumber}_db`] || false
        const bop_ml = data.bopData[`${toothNumber}_ml`] || false
        const bop_l = data.bopData[`${toothNumber}_l`] || false
        const bop_dl = data.bopData[`${toothNumber}_dl`] || false

        // 排膿データを取得
        const pus_mb = data.pusData[`${toothNumber}_mb`] || false
        const pus_b = data.pusData[`${toothNumber}_b`] || false
        const pus_db = data.pusData[`${toothNumber}_db`] || false
        const pus_ml = data.pusData[`${toothNumber}_ml`] || false
        const pus_l = data.pusData[`${toothNumber}_l`] || false
        const pus_dl = data.pusData[`${toothNumber}_dl`] || false

        // 動揺度を取得
        const mobility = data.mobilityData[toothNumber]

        return {
          tooth_number: toothNumber,
          plaque_top: plaqueTop,
          plaque_right: plaqueRight,
          plaque_bottom: plaqueBottom,
          plaque_left: plaqueLeft,
          is_missing: isMissing,
          mobility,
          ppd_mb,
          ppd_b,
          ppd_db,
          ppd_ml,
          ppd_l,
          ppd_dl,
          bop_mb,
          bop_b,
          bop_db,
          bop_ml,
          bop_l,
          bop_dl,
          pus_mb,
          pus_b,
          pus_db,
          pus_ml,
          pus_l,
          pus_dl,
        }
      })

      await updatePeriodontalExam(examId, {
        tooth_data: toothDataList,
      })

      // 成功したらモーダルを閉じて一覧を再読み込み
      setIsEditModalOpen(false)
      setSelectedExam(null)
      await loadExams()
    } catch (err) {
      console.error('Failed to update periodontal exam:', err)
      alert('検査の更新に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">歯周検査</h2>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>新規作成</span>
          </Button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* ローディング表示 */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      ) : (
        /* 検査履歴一覧 */
        <PeriodontalExamList
          exams={exams}
          onView={handleViewExam}
          onEdit={handleEditExam}
          onDelete={handleDeleteExam}
        />
      )}

      {/* 新規作成モーダル */}
      <PeriodontalCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveExam}
        missingTeeth={missingTeeth}
        patientId={patientId}
      />

      {/* 詳細表示モーダル */}
      <PeriodontalDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedExam(null)
        }}
        examination={selectedExam}
        missingTeeth={missingTeeth}
      />

      {/* 編集モーダル */}
      <PeriodontalEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedExam(null)
        }}
        onSave={handleUpdateExam}
        examination={selectedExam}
        missingTeeth={missingTeeth}
      />
    </div>
  )
}
