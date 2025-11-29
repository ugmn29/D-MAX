'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Plus } from 'lucide-react'
import { VisualExamList } from './visual-exam-list'
import { VisualExamCreateModal } from './visual-exam-create-modal'
import { VisualExamDetailModal } from './visual-exam-detail-modal'
import {
  createVisualExamination,
  getVisualExaminations,
  getVisualExamination,
  updateVisualExamination,
  deleteVisualExamination,
  type VisualExamination,
  type VisualToothData,
} from '@/lib/api/visual-exams'
import { getClinicId } from '@/lib/utils/get-clinic'
import { getPatientById } from '@/lib/api/patients'

interface VisualExamTabProps {
  patientId: string
}

export function VisualExamTab({ patientId }: VisualExamTabProps) {
  const [exams, setExams] = useState<VisualExamination[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<VisualExamination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [patientAge, setPatientAge] = useState<number | null>(null)

  // 検査一覧を読み込み
  const loadExams = async () => {
    try {
      setIsLoading(true)
      const data = await getVisualExaminations(patientId)
      setExams(data)
    } catch (error) {
      console.error('Failed to load visual examinations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 患者情報と年齢を読み込み
  const loadPatientAge = async () => {
    try {
      const clinicId = getClinicId()
      const patient = await getPatientById(clinicId, patientId)

      console.log('患者情報:', patient)

      if (patient?.birth_date) {
        const birthDate = new Date(patient.birth_date)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }

        console.log('計算された年齢:', age)
        setPatientAge(age)
      } else {
        console.log('生年月日が見つかりません')
      }
    } catch (error) {
      console.error('Failed to load patient age:', error)
    }
  }

  useEffect(() => {
    loadExams()
    loadPatientAge()
  }, [patientId])

  // 新規作成
  const handleSave = async (toothData: VisualToothData[]) => {
    try {
      const clinicId = getClinicId()

      await createVisualExamination({
        patient_id: patientId,
        clinic_id: clinicId,
        tooth_data: toothData,
      })

      setIsCreateModalOpen(false)
      await loadExams()
    } catch (error) {
      console.error('Failed to create visual examination:', error)
      alert('検査の保存に失敗しました')
    }
  }

  // 詳細表示
  const handleView = async (examId: string) => {
    try {
      const exam = await getVisualExamination(examId)
      setSelectedExam(exam)
      setIsDetailModalOpen(true)
    } catch (error) {
      console.error('Failed to load visual examination:', error)
      alert('検査の読み込みに失敗しました')
    }
  }

  // 編集
  const handleEdit = async (examId: string) => {
    try {
      const exam = await getVisualExamination(examId)
      setSelectedExam(exam)
      setIsEditModalOpen(true)
    } catch (error) {
      console.error('Failed to load visual examination:', error)
      alert('検査の読み込みに失敗しました')
    }
  }

  // 編集保存
  const handleEditSave = async (toothData: VisualToothData[]) => {
    if (!selectedExam) return

    try {
      // 更新を実行
      await updateVisualExamination(selectedExam.id, {
        tooth_data: toothData,
      })

      // モーダルを閉じる
      setIsEditModalOpen(false)
      setSelectedExam(null)

      // リストを再読み込みして最新データを反映
      await loadExams()
    } catch (error) {
      console.error('Failed to update visual examination:', error)
      alert('検査の更新に失敗しました')
    }
  }

  // 削除
  const handleDelete = async (examId: string) => {
    try {
      await deleteVisualExamination(examId)
      await loadExams()
    } catch (error) {
      console.error('Failed to delete visual examination:', error)
      alert('検査の削除に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Eye className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">視診</h2>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={patientAge === null}
          >
            <Plus className="w-5 h-5 mr-2" />
            <span>新規作成</span>
          </Button>
          {patientAge === null && (
            <span className="text-sm text-gray-500">患者情報読み込み中...</span>
          )}
        </div>
      </div>

      {/* 検査履歴一覧 */}
      <VisualExamList exams={exams} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />

      {/* 新規作成モーダル */}
      <VisualExamCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSave}
        patientAge={patientAge}
      />

      {/* 編集モーダル */}
      <VisualExamCreateModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedExam(null)
        }}
        onSave={handleEditSave}
        initialData={selectedExam?.tooth_data}
      />

      {/* 詳細表示モーダル */}
      <VisualExamDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedExam(null)
        }}
        examination={selectedExam}
      />
    </div>
  )
}
