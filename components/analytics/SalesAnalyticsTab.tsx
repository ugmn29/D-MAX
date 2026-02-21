'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  Shield,
  User,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import SalesImportWizard from './SalesImportWizard'

interface KPI {
  total_revenue: number
  insurance_revenue: number
  self_pay_revenue: number
  avg_per_patient: number
  total_records: number
  unique_patients: number
}

interface MonthlyRow {
  month: string
  insurance: number
  self_pay: number
  total: number
  count: number
}

interface InsuranceTypeRow {
  type: string
  amount: number
  count: number
}

interface TreatmentMenuRow {
  name: string
  amount: number
  count: number
}

interface ImportHistoryRow {
  id: string
  file_name: string
  import_date: string
  total_records: number
  success_records: number
  failed_records: number
  status: string
}

interface SalesData {
  has_data: boolean
  kpi: KPI | null
  monthly: MonthlyRow[]
  by_insurance_type: InsuranceTypeRow[]
  by_treatment_menu: TreatmentMenuRow[]
  import_history: ImportHistoryRow[]
}

interface SalesAnalyticsTabProps {
  clinicId: string
  startDate?: string
  endDate?: string
}

function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />完了
      </Badge>
    )
  }
  if (status === 'failed') {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />失敗
      </Badge>
    )
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
      <Clock className="w-3 h-3 mr-1" />処理中
    </Badge>
  )
}

export function SalesAnalyticsTab({ clinicId, startDate, endDate }: SalesAnalyticsTabProps) {
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showImportWizard, setShowImportWizard] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ clinic_id: clinicId })
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const res = await fetch(`/api/analytics/sales?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error('売上データ取得エラー:', e)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [clinicId, startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleImportComplete = () => {
    setShowImportWizard(false)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">売上分析</h2>
          {data?.has_data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.kpi?.total_records.toLocaleString()} 件のレセプトデータ
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImportWizard(true)}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          CSVインポート
        </Button>
      </div>

      {/* データなし状態 */}
      {!data?.has_data && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">売上データがありません</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              レセコン（power5G等）からCSVをエクスポートして取り込むと、
              売上分析・保険種別内訳・診療メニュー別集計が表示されます。
            </p>
            <Button onClick={() => setShowImportWizard(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              CSVインポートを開始
            </Button>

            {/* インポート履歴（データなしでも表示） */}
            {data && data.import_history.length > 0 && (
              <div className="mt-8 w-full max-w-lg text-left">
                <p className="text-xs font-medium text-gray-500 mb-2">インポート履歴</p>
                {data.import_history.map(h => (
                  <div key={h.id} className="flex items-center justify-between py-2 border-t text-sm">
                    <span className="text-gray-700 truncate max-w-xs">{h.file_name}</span>
                    <StatusBadge status={h.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* データあり状態 */}
      {data?.has_data && data.kpi && (
        <>
          {/* KPI カード */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">総売上</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatYen(data.kpi.total_revenue)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {data.kpi.total_records.toLocaleString()} 件
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">保険診療売上</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatYen(data.kpi.insurance_revenue)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {data.kpi.total_revenue > 0
                        ? Math.round((data.kpi.insurance_revenue / data.kpi.total_revenue) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">自費診療売上</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatYen(data.kpi.self_pay_revenue)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {data.kpi.total_revenue > 0
                        ? Math.round((data.kpi.self_pay_revenue / data.kpi.total_revenue) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">患者平均単価</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatYen(data.kpi.avg_per_patient)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {data.kpi.unique_patients.toLocaleString()} 名
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 月別売上推移 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">月別売上推移</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-xs text-gray-500 font-medium">月</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">保険</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">自費</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">合計</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">件数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthly.map(row => (
                        <tr key={row.month} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2 text-gray-700">{row.month}</td>
                          <td className="py-2 text-right text-gray-600">
                            {formatYen(row.insurance)}
                          </td>
                          <td className="py-2 text-right text-gray-600">
                            {formatYen(row.self_pay)}
                          </td>
                          <td className="py-2 text-right font-medium">{formatYen(row.total)}</td>
                          <td className="py-2 text-right text-gray-500">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-gray-50">
                        <td className="py-2 font-medium text-xs">合計</td>
                        <td className="py-2 text-right font-medium text-xs">
                          {formatYen(data.monthly.reduce((s, r) => s + r.insurance, 0))}
                        </td>
                        <td className="py-2 text-right font-medium text-xs">
                          {formatYen(data.monthly.reduce((s, r) => s + r.self_pay, 0))}
                        </td>
                        <td className="py-2 text-right font-bold">
                          {formatYen(data.kpi.total_revenue)}
                        </td>
                        <td className="py-2 text-right font-medium text-xs">
                          {data.kpi.total_records}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 保険種別内訳 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">保険種別内訳</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.by_insurance_type.map(row => {
                    const pct =
                      data.kpi!.total_revenue > 0
                        ? Math.round((row.amount / data.kpi!.total_revenue) * 100)
                        : 0
                    return (
                      <div key={row.type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{row.type}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{row.count}件</span>
                            <span className="font-medium">{formatYen(row.amount)}</span>
                            <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 診療メニュー別 */}
          {data.by_treatment_menu.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">診療メニュー別売上</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-xs text-gray-500 font-medium">
                          診療メニュー
                        </th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">件数</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">売上</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">構成比</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.by_treatment_menu.map((row, i) => {
                        const pct =
                          data.kpi!.total_revenue > 0
                            ? Math.round((row.amount / data.kpi!.total_revenue) * 100)
                            : 0
                        return (
                          <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2 text-gray-700">{row.name}</td>
                            <td className="py-2 text-right text-gray-500">{row.count}</td>
                            <td className="py-2 text-right font-medium">{formatYen(row.amount)}</td>
                            <td className="py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className="bg-purple-500 h-1.5 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* インポート履歴 */}
          {data.import_history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">インポート履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-xs text-gray-500 font-medium">ファイル名</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">日時</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">総件数</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">成功</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">失敗</th>
                        <th className="text-right py-2 text-xs text-gray-500 font-medium">状態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.import_history.map(h => (
                        <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2 text-gray-700 max-w-xs truncate">{h.file_name}</td>
                          <td className="py-2 text-right text-gray-500 text-xs">
                            {new Date(h.import_date).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-2 text-right">{h.total_records}</td>
                          <td className="py-2 text-right text-green-600">{h.success_records}</td>
                          <td className="py-2 text-right text-red-500">{h.failed_records}</td>
                          <td className="py-2 text-right">
                            <StatusBadge status={h.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* CSVインポートウィザード ダイアログ */}
      <Dialog open={showImportWizard} onOpenChange={setShowImportWizard}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>売上CSVインポート</DialogTitle>
          </DialogHeader>
          <SalesImportWizard
            clinicId={clinicId}
            onComplete={handleImportComplete}
            onClose={() => setShowImportWizard(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
