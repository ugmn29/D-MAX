'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  User
} from 'lucide-react'
import { calculateAge } from '@/lib/utils/date'
import { PatientDetailTabs } from '@/components/patients/patient-detail-tabs'
import { getPatientById } from '@/lib/api/patients'
import { Patient } from '@/types/database'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const data = await getPatientById(DEMO_CLINIC_ID, patientId)
        console.log('患者詳細ページ: 取得した患者データ', data)
        setPatient(data)
      } catch (error) {
        console.error('患者データの取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPatient()
  }, [patientId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">患者が見つかりません</h2>
          <p className="text-gray-600">指定された患者IDの患者データが存在しません。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* ヘッダー（固定） */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-medium text-gray-600">
                診察券番号: {patient.patient_number || '未発行'}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.last_name} {patient.first_name}
              </h1>
            </div>
            {!patient.is_registered && (
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <User className="w-4 h-4 mr-2" />
                本登録
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* タブ構成（スクロール可能） */}
      <div className="flex-1 overflow-hidden">
        <PatientDetailTabs patientId={patientId} />
      </div>
    </div>
  )
}