'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PrescribePage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.patientId as string

  const [patient, setPatient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPatient()
  }, [patientId])

  const loadPatient = async () => {
    try {
      const response = await fetch(`/api/training/clinic/patient?patientId=${patientId}`)
      const data = await response.json()

      if (response.ok) {
        setPatient(data.patient)
      }
    } catch (error) {
      console.error('患者情報取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <button
            onClick={() => router.push('/training/clinic/patients')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-900">トレーニング処方</h1>
          {patient && (
            <p className="text-sm text-gray-500 mt-1">
              {patient.name}さん（患者番号: {patient.patient_number}）
            </p>
          )}
        </div>
      </header>

      <div className="px-6 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-gray-600">トレーニング処方機能は準備中です</p>
        </div>
      </div>
    </div>
  )
}
