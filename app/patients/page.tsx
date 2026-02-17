'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Users, Phone, Calendar } from 'lucide-react'
import Link from 'next/link'
import { getPatients, searchPatients, getPatientsStats } from '@/lib/api/patients'
import { Patient } from '@/types/database'
import { calculateAge } from '@/lib/utils/date'
import { useClinicId } from '@/hooks/use-clinic-id'

export default function PatientsPage() {
  const clinicId = useClinicId()
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [stats, setStats] = useState({ total: 0, registered: 0, temporary: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 患者データを読み込み
  const loadPatients = async () => {
    try {
      setLoading(true)
      const [patientsData, statsData] = await Promise.all([
        getPatients(clinicId),
        getPatientsStats(clinicId)
      ])
      setPatients(patientsData)
      setFilteredPatients(patientsData)
      setStats(statsData)
      setError(null)
    } catch (err) {
      console.error('データ読み込みエラー:', err)
      setError('患者データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 検索処理
  const handleSearch = async (query: string) => {
    try {
      setSearchQuery(query)
      if (query.trim()) {
        const results = await searchPatients(clinicId, query)
        setFilteredPatients(results)
      } else {
        setFilteredPatients(patients)
      }
    } catch (err) {
      console.error('検索エラー:', err)
      setError('検索に失敗しました')
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">患者管理</h1>
            <p className="text-gray-600">患者情報の管理と検索</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/patients/unlinked-questionnaires">
              <Button variant="outline">
                <Search className="w-4 h-4 mr-2" />
                未連携問診票
              </Button>
            </Link>
            <Link href="/patients/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新規患者登録
              </Button>
            </Link>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPatients}
              className="mt-2"
            >
              再試行
            </Button>
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総患者数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.total}
                  </p>
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
                    {loading ? '...' : stats.registered}
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
                    {loading ? '...' : stats.temporary}
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
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* 患者一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>患者一覧 ({loading ? '...' : filteredPatients.length}件)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shikabot-primary"></div>
              </div>
            ) : (
              <>
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
                              {patient.birth_date ? `${calculateAge(patient.birth_date)}歳` : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600">
                              {patient.gender === 'male' ? '男性' :
                               patient.gender === 'female' ? '女性' :
                               patient.gender === 'other' ? 'その他' : '-'}
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

                {filteredPatients.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchQuery ? '検索条件に一致する患者が見つかりません' : '患者データがありません'}
                    </p>
                    {!searchQuery && (
                      <Link href="/patients/new">
                        <Button className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          最初の患者を登録
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}