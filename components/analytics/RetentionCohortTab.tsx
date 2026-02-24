'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, RefreshCw } from 'lucide-react'

interface CohortMonthData {
  month_offset: number
  count: number
  rate: number
}

interface CohortRow {
  cohort_month: string
  initial_count: number
  months: CohortMonthData[]
}

interface RetentionData {
  cohorts: CohortRow[]
  summary: {
    total_initial: number
    months: CohortMonthData[]
  }
  offsets: number[]
}

interface Props {
  clinicId: string
  startDate: string
  endDate: string
}

// 再来院率に応じた背景色を返す
function getCellBg(rate: number, hasData: boolean): string {
  if (!hasData) return 'bg-gray-50 text-gray-300'
  if (rate >= 70) return 'bg-green-600 text-white font-semibold'
  if (rate >= 55) return 'bg-green-500 text-white font-semibold'
  if (rate >= 40) return 'bg-green-400 text-white'
  if (rate >= 25) return 'bg-green-200 text-green-900'
  if (rate >= 10) return 'bg-green-100 text-green-800'
  return 'bg-red-50 text-red-700'
}

function formatYearMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${y}年${parseInt(m)}月`
}

export default function RetentionCohortTab({ clinicId, startDate, endDate }: Props) {
  const [data, setData] = useState<RetentionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!clinicId || !startDate || !endDate) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ clinic_id: clinicId, start_date: startDate, end_date: endDate })
      const res = await fetch(`/api/analytics/retention?${params}`)
      if (!res.ok) throw new Error('データの取得に失敗しました')
      const json = await res.json()
      setData(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [clinicId, startDate, endDate])

  // 今月より後のオフセット月はデータ未確定（灰色）
  const today = new Date()
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const isOffsetAvailable = (cohortMonth: string, offset: number): boolean => {
    const [y, m] = cohortMonth.split('-').map(Number)
    const targetDate = new Date(y, m - 1 + offset, 1)
    const target = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
    return target <= currentYearMonth
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        データ取得中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500 text-sm">{error}</div>
    )
  }

  if (!data || data.cohorts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        選択期間内に初診患者のデータがありません
      </div>
    )
  }

  const offsets = data.offsets

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-gray-500 mb-1">期間内の初診患者数</div>
            <div className="text-2xl font-bold text-gray-900">{data.summary.total_initial}<span className="text-sm font-normal ml-1">人</span></div>
          </CardContent>
        </Card>
        {data.summary.months.map(m => (
          <Card key={m.month_offset}>
            <CardContent className="pt-4">
              <div className="text-xs text-gray-500 mb-1">{m.month_offset}ヶ月後の再来院率</div>
              <div className="text-2xl font-bold text-gray-900">
                {m.rate.toFixed(1)}<span className="text-sm font-normal ml-0.5">%</span>
              </div>
              <div className="text-xs text-gray-400">{m.count}人が再来院</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* コホートテーブル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-blue-600" />
            初診患者コホート分析
          </CardTitle>
          <p className="text-xs text-gray-500">
            初診月ごとの患者グループが、その後何ヶ月後に再来院したかを追跡します。
            灰色セルは現時点でまだ到達していない期間です。
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs">
                <th className="text-left px-3 py-2.5 border-b border-gray-200 whitespace-nowrap">初診月</th>
                <th className="text-center px-3 py-2.5 border-b border-gray-200 whitespace-nowrap">初診人数</th>
                {offsets.map(offset => (
                  <th key={offset} className="text-center px-3 py-2.5 border-b border-gray-200 whitespace-nowrap">
                    {offset}ヶ月後
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map(row => (
                <tr key={row.cohort_month} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-700">
                    {formatYearMonth(row.cohort_month)}
                  </td>
                  <td className="px-3 py-2 text-center font-semibold text-gray-800">
                    {row.initial_count}<span className="text-xs font-normal text-gray-400 ml-0.5">人</span>
                  </td>
                  {row.months.map(m => {
                    const available = isOffsetAvailable(row.cohort_month, m.month_offset)
                    return (
                      <td
                        key={m.month_offset}
                        className={`px-3 py-2 text-center rounded transition-colors ${getCellBg(m.rate, available)}`}
                      >
                        {available ? (
                          <div>
                            <div className="font-medium">{m.rate.toFixed(1)}%</div>
                            <div className="text-xs opacity-75">{m.count}人</div>
                          </div>
                        ) : (
                          <div className="text-xs">—</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* 全体平均行 */}
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td className="px-3 py-2 font-semibold text-blue-800">全体平均</td>
                <td className="px-3 py-2 text-center font-semibold text-blue-800">
                  {data.summary.total_initial}<span className="text-xs font-normal ml-0.5">人</span>
                </td>
                {data.summary.months.map(m => (
                  <td key={m.month_offset} className="px-3 py-2 text-center">
                    <div className="font-semibold text-blue-800">{m.rate.toFixed(1)}%</div>
                    <div className="text-xs text-blue-600">{m.count}人</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* カラースケール凡例 */}
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
            <span>再来院率：</span>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-green-600" />
              <span>70%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-green-400" />
              <span>40%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-green-200" />
              <span>25%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-red-50 border" />
              <span>25%未満</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 補足説明 */}
      <Card className="bg-blue-50/50 border-blue-100">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2 text-sm text-blue-800">
            <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">見方のポイント</p>
              <ul className="text-xs space-y-1 text-blue-700">
                <li>• <strong>3ヶ月後の再来院率</strong>が定期クリーニングの定着度の目安です</li>
                <li>• 初診患者を「真の初診」とするため、過去に来院歴のある患者は除外しています</li>
                <li>• 灰色のセルは、現時点ではまだその月に到達していないため集計対象外です</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
