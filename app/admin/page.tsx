'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, CreditCard, RefreshCw, TrendingUp, ArrowRight } from 'lucide-react'

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
  status: string | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '稼働中', className: 'bg-blue-100 text-blue-700' },
  trial: { label: 'トライアル', className: 'bg-yellow-100 text-yellow-700' },
  suspended: { label: '停止中', className: 'bg-red-100 text-red-700' },
}

export default function AdminPage() {
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/clinics')
      .then(async r => {
        const data = await r.json()
        if (Array.isArray(data)) {
          setClinics(data)
        } else if (r.status === 401) {
          window.location.href = '/admin/login'
        } else {
          setError(`エラー(${r.status}): ${data?.error || JSON.stringify(data)}`)
        }
      })
      .catch(e => setError(`サーバーに接続できません: ${e.message}`))
      .finally(() => setLoading(false))
  }, [])

  const totalMRR = clinics.reduce((sum, c) => sum + (c.monthly_fee ?? 0), 0)
  const activeClinics = clinics.filter(c => c.status !== 'suspended').length

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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">契約クリニック一覧と売上サマリー</p>
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
              <p className="text-2xl font-bold text-gray-900">{clinics.length}
                <span className="text-sm font-normal text-gray-400 ml-1">（稼働 {activeClinics}）</span>
              </p>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-blue-600" />
            契約クリニック一覧（直近5件）
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/clinics" className="flex items-center gap-1.5">
              すべて表示
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">医院名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">プラン</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">月額</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">次回更新</th>
                </tr>
              </thead>
              <tbody>
                {clinics.slice(0, 5).map((clinic, i) => {
                  const st = statusConfig[clinic.status ?? 'active'] ?? statusConfig.active
                  return (
                    <tr
                      key={clinic.id}
                      className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <Link href={`/admin/clinics/${clinic.id}`} className="hover:underline text-blue-700">
                          {clinic.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${st.className}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {clinic.plan_name
                          ? <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{clinic.plan_name}</span>
                          : <span className="text-gray-400 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {clinic.monthly_fee != null ? `¥${clinic.monthly_fee.toLocaleString('ja-JP')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {clinic.next_billing_date
                          ? new Date(clinic.next_billing_date).toLocaleDateString('ja-JP')
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
                {clinics.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
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
