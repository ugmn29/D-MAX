'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Plus } from 'lucide-react'
import { VisualExamList } from './visual-exam-list'
import { VisualExamCreateModal } from './visual-exam-create-modal'
import {
  createVisualExamination,
  getVisualExaminations,
  deleteVisualExamination,
  type VisualExamination,
  type VisualToothData,
} from '@/lib/api/visual-exams'
import { getClinicId } from '@/lib/utils/get-clinic'

interface VisualExamTabProps {
  patientId: string
}

export function VisualExamTab({ patientId }: VisualExamTabProps) {
  const [exams, setExams] = useState<VisualExamination[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    loadExams()
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

  // 詳細表示（TODO: 実装）
  const handleView = (examId: string) => {
    console.log('View exam:', examId)
    // TODO: 詳細表示モーダルを実装
  }

  // 編集（TODO: 実装）
  const handleEdit = (examId: string) => {
    console.log('Edit exam:', examId)
    // TODO: 編集モーダルを実装
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
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            <span>新規作成</span>
          </Button>
        </div>
      </div>

      {/* 検査履歴一覧 */}
      <VisualExamList exams={exams} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />

      {/* 新規作成モーダル */}
      <VisualExamCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
