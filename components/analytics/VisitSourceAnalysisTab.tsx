'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, BarChart3, PieChart as PieChartIcon, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import type { VisitSourceAnalysisResult } from '@/lib/api/visit-source-analysis'
import { formatVisitSourceDataForCSV } from '@/lib/api/visit-source-analysis'

interface VisitSourceAnalysisTabProps {
  data: VisitSourceAnalysisResult
  loading: boolean
}

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
]

export default function VisitSourceAnalysisTab({ data, loading }: VisitSourceAnalysisTabProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')

  // グラフ用データ
  const chartData = useMemo(() => {
    return data.sources.map((source, index) => ({
      name: source.source,
      value: source.count,
      percentage: source.percentage,
      fill: source.isHistorical ? '#9CA3AF' : COLORS[index % COLORS.length]
    }))
  }, [data.sources])

  // CSVダウンロード
  const handleDownloadCSV = () => {
    const csv = formatVisitSourceDataForCSV(data)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `来院経路分析_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!data.questionExists) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">質問が利用できません</h3>
            <p className="text-gray-500">
              「{data.questionText}」の質問が標準問診表で非表示または削除されています。<br />
              過去の回答データは保持されていますが、新しいデータは収集されません。
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.totalResponses === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>選択された期間に回答データがありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">来院経路分析</h2>
          <p className="text-sm text-gray-500 mt-1">
            総回答数: {data.totalResponses}件
            {data.previousTotalResponses > 0 && (
              <span className="ml-2">
                (前期間: {data.previousTotalResponses}件)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            棒グラフ
          </Button>
          <Button
            variant={chartType === 'pie' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('pie')}
          >
            <PieChartIcon className="w-4 h-4 mr-2" />
            円グラフ
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSVエクスポート
          </Button>
        </div>
      </div>

      {/* グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>来院きっかけ別集計</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    const item = chartData.find(d => d.name === name)
                    return [
                      `${value}件 (${item?.percentage.toFixed(1)}%)`,
                      '回答数'
                    ]
                  }}
                />
                <Legend />
                <Bar dataKey="value" name="回答数" />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  outerRadius={150}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value}件`} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 詳細テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>詳細データ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">来院きっかけ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">件数</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">割合</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">前期間</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">増減</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.sources.map((source, index) => (
                  <tr key={index} className={source.isHistorical ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-3">
                      {source.source}
                      {source.isHistorical && (
                        <span className="ml-2 text-xs text-gray-500">(過去の選択肢)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{source.count}</td>
                    <td className="px-4 py-3 text-right">{source.percentage.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right text-gray-500">{source.previousCount}</td>
                    <td className="px-4 py-3 text-right">
                      {source.change !== 0 && (
                        <div className="flex items-center justify-end gap-1">
                          {source.change > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span className={source.change > 0 ? 'text-green-600' : 'text-red-600'}>
                            {source.change > 0 ? '+' : ''}{source.change}
                            ({source.changePercentage > 0 ? '+' : ''}{source.changePercentage.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                      {source.change === 0 && <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* その他の回答一覧 */}
      {data.otherResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>「その他」の回答（上位10件）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.otherResponses.map((response, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="text-sm text-gray-600">
                    {new Date(response.completed_at).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="mt-1">{response.other_text}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
