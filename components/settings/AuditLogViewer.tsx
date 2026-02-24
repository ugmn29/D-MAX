'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Download, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'

interface AuditLog {
  id: string
  created_at: string
  action_type: string
  target_table: string
  target_record_id: string
  operator: { id: string; name: string; role: string } | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
}

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  READ: { label: '閲覧', color: 'bg-blue-100 text-blue-800' },
  CREATE: { label: '作成', color: 'bg-green-100 text-green-800' },
  UPDATE: { label: '更新', color: 'bg-yellow-100 text-yellow-800' },
  DELETE: { label: '削除', color: 'bg-red-100 text-red-800' },
}

const TABLE_LABELS: Record<string, string> = {
  patients: '患者',
  appointments: '予約',
}

export function AuditLogViewer() {
  const { clinicId } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [actionType, setActionType] = useState('')
  const [targetTable, setTargetTable] = useState('')

  const fetchLogs = useCallback(async () => {
    if (!clinicId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start', startDate)
      if (endDate) params.set('end', endDate)
      if (actionType) params.set('action_type', actionType)
      if (targetTable) params.set('target_table', targetTable)

      const res = await fetch(`/api/audit-logs?${params.toString()}`)
      if (!res.ok) {
        console.error('監査ログ取得失敗:', res.status)
        return
      }
      const json = await res.json()
      setLogs(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      console.error('監査ログ取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }, [clinicId, startDate, endDate, actionType, targetTable])

  const handleDownloadCsv = async () => {
    if (!clinicId) return
    const params = new URLSearchParams({ format: 'csv' })
    if (startDate) params.set('start', startDate)
    if (endDate) params.set('end', endDate)
    if (actionType) params.set('action_type', actionType)
    if (targetTable) params.set('target_table', targetTable)

    const res = await fetch(`/api/audit-logs?${params.toString()}`)
    if (!res.ok) return

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    } catch {
      return iso
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-blue-600" />
          アクセス監査ログ
        </CardTitle>
        <p className="text-sm text-gray-500">
          患者情報・予約データへのアクセス・変更履歴（3省2ガイドライン準拠）
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* フィルター */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">開始日</label>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">終了日</label>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">操作種別</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={actionType}
              onChange={e => setActionType(e.target.value)}
            >
              <option value="">すべて</option>
              <option value="READ">閲覧</option>
              <option value="CREATE">作成</option>
              <option value="UPDATE">更新</option>
              <option value="DELETE">削除</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">対象</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={targetTable}
              onChange={e => setTargetTable(e.target.value)}
            >
              <option value="">すべて</option>
              <option value="patients">患者</option>
              <option value="appointments">予約</option>
            </select>
          </div>
          <Button size="sm" onClick={fetchLogs} disabled={loading} className="flex items-center gap-1">
            <Search className="h-3.5 w-3.5" />
            {loading ? '検索中...' : '検索'}
          </Button>
          {logs.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleDownloadCsv} className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              CSV出力
            </Button>
          )}
          {logs.length > 0 && (
            <Button size="sm" variant="ghost" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* 件数表示 */}
        {total !== null && (
          <p className="text-sm text-gray-500">{total}件のログ（最大1,000件）</p>
        )}

        {/* ログテーブル */}
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
                  <th className="text-left px-3 py-2 border-b">日時</th>
                  <th className="text-left px-3 py-2 border-b">操作者</th>
                  <th className="text-left px-3 py-2 border-b">操作</th>
                  <th className="text-left px-3 py-2 border-b">対象</th>
                  <th className="text-left px-3 py-2 border-b">変更内容</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const actionInfo = ACTION_TYPE_LABELS[log.action_type] ?? { label: log.action_type, color: 'bg-gray-100 text-gray-700' }
                  const tableLabel = TABLE_LABELS[log.target_table] ?? log.target_table
                  const hasChanges = log.action_type === 'UPDATE' &&
                    log.before_data && Object.keys(log.before_data).length > 0
                  return (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {log.operator ? (
                          <div>
                            <div className="font-medium">{log.operator.name}</div>
                            <div className="text-gray-400">{log.operator.role}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">システム</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">{tableLabel}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {hasChanges ? (
                          <details>
                            <summary className="cursor-pointer text-blue-600 hover:underline">
                              変更あり
                            </summary>
                            <div className="mt-1 space-y-1">
                              <div><span className="font-medium">変更前：</span>{JSON.stringify(log.before_data)}</div>
                              <div><span className="font-medium">変更後：</span>{JSON.stringify(log.after_data)}</div>
                            </div>
                          </details>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : total === null ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            条件を指定して「検索」を押してください
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            該当するログが見つかりません
          </div>
        )}
      </CardContent>
    </Card>
  )
}
