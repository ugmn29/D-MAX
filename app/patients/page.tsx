'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Users, Phone, Calendar } from 'lucide-react'
import Link from 'next/link'

// 仮の患者データ（後でSupabaseから取得）
const mockPatients = [
  {
    id: '1',
    patient_number: 1,
    last_name: '田中',
    first_name: '太郎',
    last_name_kana: 'タナカ',
    first_name_kana: 'タロウ',
    birth_date: '1980-05-15',
    gender: 'male' as const,
    phone: '090-1234-5678',
    email: 'tanaka@example.com',
    is_registered: true,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    patient_number: 2,
    last_name: '佐藤',
    first_name: '花子',
    last_name_kana: 'サトウ',
    first_name_kana: 'ハナコ',
    birth_date: '1975-12-03',
    gender: 'female' as const,
    phone: '080-9876-5432',
    email: 'sato@example.com',
    is_registered: true,
    created_at: '2024-01-10T14:30:00Z'
  },
  {
    id: '3',
    patient_number: 3,
    last_name: '山田',
    first_name: '次郎',
    last_name_kana: 'ヤマダ',
    first_name_kana: 'ジロウ',
    birth_date: '1995-08-22',
    gender: 'male' as const,
    phone: '070-5555-1234',
    email: '',
    is_registered: false, // 仮登録
    created_at: '2024-02-01T09:15:00Z'
  }
]

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState(mockPatients)
  const [filteredPatients, setFilteredPatients] = useState(mockPatients)

  useEffect(() => {
    // 検索フィルタリング
    const filtered = patients.filter(patient => {
      const query = searchQuery.toLowerCase()
      return (
        patient.last_name.toLowerCase().includes(query) ||
        patient.first_name.toLowerCase().includes(query) ||
        patient.last_name_kana.toLowerCase().includes(query) ||
        patient.first_name_kana.toLowerCase().includes(query) ||
        patient.patient_number.toString().includes(query) ||
        (patient.phone && patient.phone.includes(query))
      )
    })
    setFilteredPatients(filtered)
  }, [searchQuery, patients])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">患者管理</h1>
            <p className="text-gray-600">患者情報の管理と検索</p>
          </div>
          <Link href="/patients/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新規患者登録
            </Button>
          </Link>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総患者数</p>
                  <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">本登録済み</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => p.is_registered).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Phone className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">仮登録</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => !p.is_registered).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 検索バー */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="患者名、フリガナ、診察券番号、電話番号で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 患者一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>患者一覧 ({filteredPatients.length}件)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">診察券番号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">患者名</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">フリガナ</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">年齢</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">性別</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">電話番号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ステータス</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">{patient.patient_number.toString().padStart(6, '0')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {patient.last_name} {patient.first_name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">
                          {patient.last_name_kana} {patient.first_name_kana}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">
                          {calculateAge(patient.birth_date)}歳
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">
                          {patient.gender === 'male' ? '男性' :
                           patient.gender === 'female' ? '女性' : 'その他'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600 font-mono text-sm">
                          {patient.phone || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          patient.is_registered
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {patient.is_registered ? '本登録' : '仮登録'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="outline" size="sm">
                              詳細
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            編集
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPatients.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">検索条件に一致する患者が見つかりません</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}