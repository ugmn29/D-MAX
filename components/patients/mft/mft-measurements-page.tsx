'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { MftMeasurementForm, MftMeasurementFormData } from './mft-measurement-form'
import { MftMeasurementList } from './mft-measurement-list'
import { MftMeasurementChart } from './mft-measurement-chart'
import {
  getMftMeasurements,
  createMftMeasurement,
  updateMftMeasurement,
  deleteMftMeasurement,
  type MftMeasurement,
} from '@/lib/api/mft-measurements'
import { toast } from 'react-hot-toast'

interface MftMeasurementsPageProps {
  patientId: string
  clinicId: string
}

type ViewMode = 'list' | 'chart'

export function MftMeasurementsPage({ patientId, clinicId }: MftMeasurementsPageProps) {
  const [measurements, setMeasurements] = useState<MftMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMeasurement, setEditingMeasurement] = useState<MftMeasurement | null>(null)

  // データ取得
  const fetchMeasurements = async () => {
    try {
      setLoading(true)
      const data = await getMftMeasurements(patientId)
      setMeasurements(data)
    } catch (error) {
      console.log('Error fetching measurements:', error)
      const errorMessage = error instanceof Error ? error.message : '測定記録の取得に失敗しました'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeasurements()
  }, [patientId])

  // 新規作成
  const handleCreate = () => {
    setEditingMeasurement(null)
    setIsModalOpen(true)
  }

  // 編集
  const handleEdit = (measurement: MftMeasurement) => {
    setEditingMeasurement(measurement)
    setIsModalOpen(true)
  }

  // 保存
  const handleSave = async (data: MftMeasurementFormData) => {
    console.log('handleSave called with data:', data)
    console.log('patientId:', patientId, 'clinicId:', clinicId)

    try {
      if (editingMeasurement) {
        // 更新
        console.log('Updating measurement:', editingMeasurement.id)
        await updateMftMeasurement(editingMeasurement.id, data)
        toast.success('測定記録を更新しました')
      } else {
        // 新規作成
        console.log('Creating new measurement')
        const result = await createMftMeasurement({
          patient_id: patientId,
          clinic_id: clinicId,
          ...data,
        })
        console.log('Created measurement:', result)
        toast.success('測定記録を追加しました')
      }

      setIsModalOpen(false)
      setEditingMeasurement(null)
      fetchMeasurements()
    } catch (error) {
      console.log('Error saving measurement:', error)
      const errorMessage = error instanceof Error ? error.message : '保存に失敗しました'
      toast.error(errorMessage)
    }
  }

  // 削除
  const handleDelete = async (id: string) => {
    try {
      await deleteMftMeasurement(id)
      toast.success('測定記録を削除しました')
      fetchMeasurements()
    } catch (error) {
      console.log('Error deleting measurement:', error)
      const errorMessage = error instanceof Error ? error.message : '削除に失敗しました'
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            一覧表示
          </Button>
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            onClick={() => setViewMode('chart')}
            size="sm"
          >
            グラフ表示
          </Button>
        </div>

        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          新規記録
        </Button>
      </div>

      {/* コンテンツ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {viewMode === 'list' ? (
          <MftMeasurementList
            measurements={measurements}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <MftMeasurementChart measurements={measurements} />
        )}
      </div>

      {/* 入力モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingMeasurement(null)
        }}
        title={editingMeasurement ? '測定記録を編集' : '新規測定記録'}
        size="large"
      >
        <MftMeasurementForm
          measurement={editingMeasurement}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingMeasurement(null)
          }}
        />
      </Modal>
    </div>
  )
}
