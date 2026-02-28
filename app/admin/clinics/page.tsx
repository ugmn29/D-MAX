'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Building2, RefreshCw, Download } from 'lucide-react'

interface ClinicRow {
  id: string
  name: string
  email: string | null
  phone: string | null
  plan_name: string | null
  monthly_fee: number | null
  contract_start: string | null
  next_billing_date: string | null
  status: string
  created_at: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '稼働中', className: 'bg-blue-100 text-blue-700' },
  trial: { label: 'トライアル', className: 'bg-yellow-100 text-yellow-700' },
  suspended: { label: '停止中', className: 'bg-red-100 text-red-700' },
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchClinics = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/admin/clinics?${params}`)
    const data = await res.json()
    if (Array.isArray(data)) setClinics(data)
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchClinics() }, [fetchClinics])

  const handleExport = () => {
    window.location.href = '/api/admin/export/clinics'
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">クリニック管理</h1>
          <p className="text-sm text-gray-500 mt-1">全 {clinics.length} 件</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            CSVエクスポート
          </Button>
          <Button asChild size="sm" className="flex items-center gap-1.5">
            <Link href="/admin/clinics/new">
              <Plus className="w-4 h-4" />
              新規作成
            </Link>
          </Button>
        </div>
      </div>

      {/* 検索・フィルタ */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="医院名・メールで検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">すべてのステータス</option>
          <option value="active">稼働中</option>
          <option value="trial">トライアル</option>
          <option value="suspended">停止中</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              読み込み中...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">医院名</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">メール</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">電話</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">プラン</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">月額</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">次回更新</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {clinics.map((clinic, i) => {
                    const st = statusConfig[clinic.status] ?? statusConfig.active
                    return (
                      <tr
                        key={clinic.id}
                        className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            {clinic.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${st.className}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{clinic.email || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{clinic.phone || '—'}</td>
                        <td className="px-4 py-3">
                          {clinic.plan_name
                            ? <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{clinic.plan_name}</span>
                            : <span className="text-gray-400">—</span>
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/clinics/${clinic.id}`}>詳細</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/clinics/${clinic.id}/billing`}>請求</Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {clinics.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                        クリニックが見つかりません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
