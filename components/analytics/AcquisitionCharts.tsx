'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
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
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { TrendingUp, PieChartIcon, BarChartIcon, Activity, Loader2, RefreshCw, AlertCircle } from 'lucide-react'

interface AcquisitionChartsProps {
  clinicId: string
  dateRange: { from: Date; to: Date }
}

interface TrendDataPoint {
  date: string
  fullDate: string
  [key: string]: string | number
}

interface SourceDataPoint {
  name: string
  value: number
  cost: number
  conversions: number
  cpa: number
}

interface ROIDataPoint {
  month: string
  広告費: number
  売上: number
  新規患者数: number
  ROI: number
}

interface FunnelDataPoint {
  step: string
  count: number
  rate: number
}

interface ChartsApiResponse {
  data: {
    trend: TrendDataPoint[]
    source: SourceDataPoint[]
    roi: ROIDataPoint[]
    funnel: FunnelDataPoint[]
    sources: string[]
  }
}

// チャート用のカラーパレット
const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
]

export default function AcquisitionCharts({ clinicId, dateRange }: AcquisitionChartsProps) {
  const [activeTab, setActiveTab] = useState('trend')
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [sourceData, setSourceData] = useState<SourceDataPoint[]>([])
  const [roiData, setRoiData] = useState<ROIDataPoint[]>([])
  const [funnelData, setFunnelData] = useState<FunnelDataPoint[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [selectedMetric, setSelectedMetric] = useState<'count' | 'cost' | 'cpa'>('count')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // データ取得
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        clinic_id: clinicId,
        start_date: dateRange.from.toISOString().split('T')[0],
        end_date: dateRange.to.toISOString().split('T')[0],
      })

      const response = await fetch(`/api/analytics/charts?${params}`)

      if (!response.ok) {
        throw new Error('データの取得に失敗しました')
      }

      const result: ChartsApiResponse = await response.json()

      setTrendData(result.data.trend)
      setSourceData(result.data.source)
      setRoiData(result.data.roi)
      setFunnelData(result.data.funnel)
      setSources(result.data.sources)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [clinicId, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              {selectedMetric === 'cost' && '円'}
              {selectedMetric === 'cpa' && '円'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading && trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">データを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChartIcon className="w-5 h-5" />
          グラフ・チャート
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          更新
        </Button>
      </div>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="trend" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            トレンド
          </TabsTrigger>
          <TabsTrigger value="source" className="flex items-center gap-1">
            <PieChartIcon className="w-4 h-4" />
            流入元
          </TabsTrigger>
          <TabsTrigger value="roi" className="flex items-center gap-1">
            <BarChartIcon className="w-4 h-4" />
            ROI
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            ファネル
          </TabsTrigger>
        </TabsList>

        {/* トレンドチャート */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">流入元別トレンド（過去30日）</CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {sources.map((source, index) => (
                        <Area
                          key={source}
                          type="monotone"
                          dataKey={source}
                          stackId="1"
                          stroke={COLORS[index % COLORS.length]}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={0.6}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  トレンドデータがありません
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 流入元別チャート */}
        <TabsContent value="source">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">流入元構成比</CardTitle>
              </CardHeader>
              <CardContent>
                {sourceData.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-gray-500">
                    データがありません
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">流入元別比較</CardTitle>
                  <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as 'count' | 'cost' | 'cpa')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">患者数</SelectItem>
                      <SelectItem value="cost">広告費</SelectItem>
                      <SelectItem value="cpa">CPA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {sourceData.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sourceData}
                        layout="vertical"
                        margin={{ left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number) => [
                            selectedMetric === 'count'
                              ? `${value}名`
                              : `¥${value.toLocaleString()}`,
                            selectedMetric === 'count' ? '患者数' : selectedMetric === 'cost' ? '広告費' : 'CPA'
                          ]}
                        />
                        <Bar
                          dataKey={
                            selectedMetric === 'count' ? 'value' :
                            selectedMetric === 'cost' ? 'cost' :
                            'cpa'
                          }
                          fill="#3B82F6"
                          radius={[0, 4, 4, 0]}
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-gray-500">
                    データがありません
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ROIチャート */}
        <TabsContent value="roi">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">広告費 vs 売上推移（過去6ヶ月）</CardTitle>
              </CardHeader>
              <CardContent>
                {roiData.length > 0 ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roiData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === '広告費' || name === '売上') {
                              return [`¥${value.toLocaleString()}`, name]
                            }
                            return [value, name]
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="広告費" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="売上" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="新規患者数"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6' }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-500">
                    ROIデータがありません
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ROI推移</CardTitle>
              </CardHeader>
              <CardContent>
                {roiData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={roiData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip formatter={(value: number) => [`${value}%`, 'ROI']} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ROI"
                          stroke="#8B5CF6"
                          strokeWidth={3}
                          dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    ROIデータがありません
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ファネルチャート */}
        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">予約ファネル分析</CardTitle>
            </CardHeader>
            <CardContent>
              {funnelData.length > 0 ? (
                <>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={funnelData}
                        layout="vertical"
                        margin={{ left: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="step" type="category" tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === 'rate') return [`${value}%`, '到達率']
                            return [value, '人数']
                          }}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                          {funnelData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`rgba(59, 130, 246, ${1 - index * 0.15})`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ファネル詳細 */}
                  <div className="mt-6 grid grid-cols-5 gap-2">
                    {funnelData.map((item, index) => (
                      <div key={item.step} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{item.count}</div>
                        <div className="text-xs text-gray-500">{item.step}</div>
                        {index < funnelData.length - 1 && funnelData[index + 1] && (
                          <div className="text-xs text-red-500 mt-1">
                            ↓ {((1 - funnelData[index + 1].count / item.count) * 100).toFixed(1)}% 離脱
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-gray-500">
                  ファネルデータがありません
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
