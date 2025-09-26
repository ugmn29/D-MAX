'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Edit,
  User
} from 'lucide-react'
import Link from 'next/link'
import { calculateAge } from '@/lib/utils/date'
import { PatientDetailTabs } from '@/components/patients/patient-detail-tabs'

// 仮の患者詳細データ
const mockPatientDetail = {
  id: '1',
  patient_number: 1,
  last_name: '福永',
  first_name: '真大',
  last_name_kana: 'フクナガ',
  first_name_kana: 'シンダイ',
  birth_date: '1995-02-09',
  gender: 'male' as const,
  phone: '08014103036',
  email: '',
  postal_code: '',
  prefecture: '',
  city: '',
  address_line: '',
  allergies: '',
  medical_history: '',
  is_registered: true,
  created_at: '2024-01-15T10:00:00Z'
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient] = useState(mockPatientDetail) // 後でSupabaseから取得

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/patients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                患者一覧に戻る
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-medium text-gray-600">
                  ID: {patient.patient_number}
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

        {/* タブ構成 */}
        <PatientDetailTabs patientId={patientId} />
      </div>
    </div>
  )
}