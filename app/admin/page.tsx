'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, CreditCard, RefreshCw, TrendingUp, LogOut } from 'lucide-react'

interface ClinicRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  address_line: string | null
  created_at: string
  plan_name: string
  monthly_fee: number
  contract_start: string | null
  next_billing_date: string | null
  billing_email: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    router.push('/admin/login')
  }

  useEffect(() => {
    fetch('/api/admin/clinics')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClinics(data)
        } else {
          setError('データの取得に失敗しました')
        }
      })
      .catch(() => setError('サーバーに接続できません'))
      .finally(() => setLoading(false))
  }, [])

  const totalMRR = clinics.reduce((sum, c) => sum + (c.monthly_fee || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        読み込み中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HubDent 管理者ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">契約クリニック一覧と売上サマリー</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          ログアウト
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">契約医院数</p>
              <p className="text-2xl font-bold text-gray-900">{clinics.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">月次売上（MRR）</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{totalMRR.toLocaleString('ja-JP')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">平均月額</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{clinics.length > 0 ? Math.round(totalMRR / clinics.length).toLocaleString('ja-JP') : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* クリニック一覧テーブル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-blue-600" />
            契約クリニック一覧
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">医院名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">メール</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">電話</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">プラン</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">月額</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">契約開始</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">次回更新</th>
                </tr>
              </thead>
              <tbody>
                {clinics.map((clinic, i) => (
                  <tr
                    key={clinic.id}
                    className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{clinic.name}</td>
                    <td className="px-4 py-3 text-gray-600">{clinic.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{clinic.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {clinic.plan_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ¥{clinic.monthly_fee.toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {clinic.contract_start
                        ? new Date(clinic.contract_start).toLocaleDateString('ja-JP')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {clinic.next_billing_date
                        ? new Date(clinic.next_billing_date).toLocaleDateString('ja-JP')
                        : '—'}
                    </td>
                  </tr>
                ))}
                {clinics.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      クリニックデータがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
