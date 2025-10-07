'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Patient } from '@/types/database'
import { getPatients } from '@/lib/api/patients'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      console.log('患者データ取得開始...')
      const data = await getPatients(DEMO_CLINIC_ID)

      console.log('取得した患者データ:', data)
      console.log('患者数:', data?.length || 0)
      
      // 各患者のis_registered状態を確認
      if (data && data.length > 0) {
        console.log('全患者のis_registered状態:')
        data.forEach(p => {
          console.log(`- ${p.last_name} ${p.first_name} (患者番号: ${p.patient_number}): is_registered = ${p.is_registered}`)
        })
      }

      // 本登録済みの患者のみをフィルタリング
      const registeredPatients = data.filter(p => {
        const isRegistered = p.is_registered === true
        if (!isRegistered) {
          console.log(`フィルタリング除外: ${p.last_name} ${p.first_name} (is_registered: ${p.is_registered})`)
        }
        return isRegistered
      })
      console.log('本登録済み患者数:', registeredPatients.length)
      console.log('本登録済み患者:', registeredPatients.map(p => `${p.last_name} ${p.first_name}`))
      
      setPatients(registeredPatients)
    } catch (error) {
      console.error('患者取得エラー:', error)
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPatients = patients.filter(
    (patient) =>
      `${patient.last_name} ${patient.first_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_number.toString().toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/training/clinic')}
              className="text-blue-600 hover:text-blue-700 mb-2"
            >
              ← 戻る
            </button>
            <h1 className="text-2xl font-bold text-gray-900">患者管理</h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* 検索バー */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="患者名または患者番号で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 患者リスト */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    患者番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    生年月日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    電話番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      患者が見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.patient_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.last_name} {patient.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('ja-JP') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => router.push(`/training/clinic/patient/${patient.id}`)}
                          className="text-blue-600 hover:text-blue-700 mr-4"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => router.push(`/training/clinic/prescribe/${patient.id}`)}
                          className="text-green-600 hover:text-green-700"
                        >
                          処方
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
