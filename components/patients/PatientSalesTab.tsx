'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, RefreshCw } from 'lucide-react'

interface SalesRow {
  id: string
  treatment_date: string | null
  receipt_number: string | null
  insurance_type_label: string
  insurance_points: number
  insurance_amount: number
  patient_copay: number
  self_pay_amount: number
  total_amount: number
  category: string
  payment_method: string | null
  notes: string | null
  treatment_menu_name: string | null
  staff_name: string | null
}

interface Totals {
  insurance_amount: number
  patient_copay: number
  self_pay_amount: number
  total_amount: number
}

interface PatientSalesTabProps {
  patientId: string
  clinicId: string
}

function formatYen(amount: number): string {
  if (amount === 0) return '—'
  return `¥${amount.toLocaleString('ja-JP')}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function PatientSalesTab({ patientId, clinicId }: PatientSalesTabProps) {
  const [rows, setRows] = useState<SalesRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/patients/${patientId}/sales?clinic_id=${clinicId}`
        )
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setRows(json.data ?? [])
        setTotals(json.totals ?? null)
      } catch (e) {
        console.error('患者売上データ取得エラー:', e)
        setRows([])
        setTotals(null)
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [patientId, clinicId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">読み込み中...</span>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">売上データがありません</h3>
          <p className="text-xs text-gray-500">
            分析ページの売上タブからCSVをインポートすると履歴が表示されます。
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* サマリー */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600 mb-0.5">総売上</p>
            <p className="text-lg font-bold text-blue-900">
              ¥{totals.total_amount.toLocaleString('ja-JP')}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-600 mb-0.5">保険請求額</p>
            <p className="text-lg font-bold text-green-900">
              ¥{totals.insurance_amount.toLocaleString('ja-JP')}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-xs text-orange-600 mb-0.5">患者負担</p>
            <p className="text-lg font-bold text-orange-900">
              ¥{totals.patient_copay.toLocaleString('ja-JP')}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs text-purple-600 mb-0.5">自費</p>
            <p className="text-lg font-bold text-purple-900">
              ¥{totals.self_pay_amount.toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
      )}

      {/* 明細テーブル */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                診療日
              </th>
              <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                メニュー
              </th>
              <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                保険種別
              </th>
              <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                点数
              </th>
              <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                保険請求
              </th>
              <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                患者負担
              </th>
              <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                自費
              </th>
              <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium whitespace-nowrap">
                合計
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                  {formatDate(row.treatment_date)}
                </td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate">
                  {row.treatment_menu_name ?? '—'}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={
                      row.category === 'self_pay'
                        ? 'border-purple-200 text-purple-700 bg-purple-50'
                        : 'border-green-200 text-green-700 bg-green-50'
                    }
                  >
                    {row.insurance_type_label || (row.category === 'self_pay' ? '自費' : '保険')}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {row.insurance_points ? `${row.insurance_points}点` : '—'}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatYen(row.insurance_amount)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatYen(row.patient_copay)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatYen(row.self_pay_amount)}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                  {formatYen(row.total_amount)}
                </td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot className="bg-gray-50 border-t-2">
              <tr>
                <td colSpan={3} className="px-3 py-2.5 text-xs font-medium text-gray-600">
                  合計 {rows.length}件
                </td>
                <td className="px-3 py-2.5 text-right text-xs font-medium text-gray-600">—</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                  ¥{totals.insurance_amount.toLocaleString('ja-JP')}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                  ¥{totals.patient_copay.toLocaleString('ja-JP')}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                  ¥{totals.self_pay_amount.toLocaleString('ja-JP')}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                  ¥{totals.total_amount.toLocaleString('ja-JP')}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
