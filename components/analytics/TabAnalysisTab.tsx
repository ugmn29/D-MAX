'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MousePointerClick, TrendingUp, CheckCircle, Download } from 'lucide-react'
import { exportToCSV, CSVColumn } from '@/lib/utils/export-csv'

interface TabAnalysisTabProps {
  clinicId: string
  startDate: string
  endDate: string
}

interface TabStats {
  tab_id: string
  tab_label: string
  tab_position: string
  total_clicks: number
  visited_booking: number
  completed_booking: number
  visit_rate: number
  completion_rate: number
}

interface CrossAnalysis {
  tab_id: string
  tab_label: string
  utm_source: string
  clicks: number
  bookings: number
  conversion_rate: number
}

export default function TabAnalysisTab({ clinicId, startDate, endDate }: TabAnalysisTabProps) {
  const [loading, setLoading] = useState(false)
  const [tabStats, setTabStats] = useState<TabStats[]>([])
  const [crossAnalysis, setCrossAnalysis] = useState<CrossAnalysis[]>([])
  const [totalClicks, setTotalClicks] = useState(0)
  const [totalBookings, setTotalBookings] = useState(0)

  useEffect(() => {
    loadData()
  }, [clinicId, startDate, endDate])

  const loadData = async () => {
    try {
      setLoading(true)

      const res = await fetch(
        `/api/analytics/tab-analysis?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`
      )

      if (res.ok) {
        const json = await res.json()
        setTabStats(json.data.tab_stats || [])
        setCrossAnalysis(json.data.cross_analysis || [])
        setTotalClicks(json.data.total_clicks || 0)
        setTotalBookings(json.data.total_bookings || 0)
      }
    } catch (error) {
      console.error('タブ分析データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportTabStatsCSV = () => {
    const columns: CSVColumn[] = [
      { key: 'tab_id', label: 'タブID' },
      { key: 'tab_label', label: 'タブ名' },
      { key: 'tab_position', label: '位置' },
      { key: 'total_clicks', label: 'クリック数' },
      { key: 'visited_booking', label: '予約ページ到達数' },
      { key: 'completed_booking', label: '予約完了数' },
      { key: 'visit_rate', label: '到達率(%)', format: (v) => v.toFixed(1) },
      { key: 'completion_rate', label: '予約完了率(%)', format: (v) => v.toFixed(1) },
    ]

    exportToCSV(tabStats, columns, `tab_analysis_${startDate}_${endDate}.csv`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const overallConversionRate = totalClicks > 0
    ? (totalBookings / totalClicks) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* エクスポートボタン */}
      <div className="flex justify-end">
        <Button onClick={exportTabStatsCSV} variant="outline" disabled={tabStats.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          CSVエクスポート
        </Button>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">総タブクリック数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalClicks}回
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">予約完了数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalBookings}件
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">全体コンバージョン率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {overallConversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* タブ別統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointerClick className="w-5 h-5" />
            タブ別クリック数と予約完了率
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            どのタブから最も予約に繋がっているかを確認
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tabStats.length > 0 ? (
              tabStats.map((tab, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <div className="font-medium text-gray-900">{tab.tab_label}</div>
                        <div className="text-xs text-gray-500">
                          ID: {tab.tab_id} / 位置: {tab.tab_position || '不明'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{tab.total_clicks}回</div>
                        <div className="text-xs text-gray-500">クリック</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{tab.completed_booking}件</div>
                        <div className="text-xs text-gray-500">予約完了</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">{tab.completion_rate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">完了率</div>
                      </div>
                    </div>
                  </div>

                  {/* 詳細情報 */}
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600">予約ページ到達</div>
                      <div className="font-bold text-blue-600">
                        {tab.visited_booking}回 ({tab.visit_rate.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600">予約完了</div>
                      <div className="font-bold text-green-600">
                        {tab.completed_booking}件 ({tab.completion_rate.toFixed(1)}%)
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600">離脱</div>
                      <div className="font-bold text-red-600">
                        {tab.total_clicks - tab.visited_booking}回
                      </div>
                    </div>
                  </div>

                  {/* プログレスバー */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>予約ページ到達率</span>
                      <span>{tab.visit_rate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${tab.visit_rate}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span>予約完了率</span>
                      <span>{tab.completion_rate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${tab.completion_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                データがありません
                <p className="text-sm mt-2">
                  HP側でタブクリックトラッキングを設定すると、データが表示されます
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 流入元×タブのクロス分析 */}
      {crossAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              流入元×タブのクロス分析
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              どの流入元から来たユーザーが、どのタブから予約しているか
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">タブ</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">流入元</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">クリック数</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">予約数</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">完了率</th>
                  </tr>
                </thead>
                <tbody>
                  {crossAnalysis.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{item.tab_label}</td>
                      <td className="px-4 py-3 text-sm">{item.utm_source}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.clicks}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">{item.bookings}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        {item.conversion_rate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
