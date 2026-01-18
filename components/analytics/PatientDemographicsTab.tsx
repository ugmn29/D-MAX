'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Users, TrendingUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PatientDemographicsTabProps {
  clinicId: string
  dateRange: { from: Date; to: Date }
}

interface AgeDistribution {
  age: string
  male: number
  female: number
  total: number
}

interface GenderData {
  name: string
  value: number
  color: string
}

interface AgeBySource {
  source: string
  [key: string]: string | number
}

interface RevenueByAge {
  age: string
  avgRevenue: number
  topTreatment: string
  patientCount: number
}

interface DemographicsApiResponse {
  data: {
    age_distribution: AgeDistribution[]
    gender_distribution: GenderData[]
    age_by_source: AgeBySource[]
    revenue_by_age: RevenueByAge[]
    total_patients: number
    total_male: number
    total_female: number
    most_common_age: string
    highest_revenue_age: string
  }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function PatientDemographicsTab({ clinicId, dateRange }: PatientDemographicsTabProps) {
  const [ageData, setAgeData] = useState<AgeDistribution[]>([])
  const [genderData, setGenderData] = useState<GenderData[]>([])
  const [ageBySourceData, setAgeBySourceData] = useState<AgeBySource[]>([])
  const [revenueByAge, setRevenueByAge] = useState<RevenueByAge[]>([])
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPatients, setTotalPatients] = useState(0)
  const [mostCommonAge, setMostCommonAge] = useState('-')
  const [highestRevenueAge, setHighestRevenueAge] = useState('-')

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

      const response = await fetch(`/api/analytics/demographics?${params}`)

      if (!response.ok) {
        throw new Error('データの取得に失敗しました')
      }

      const result: DemographicsApiResponse = await response.json()

      setAgeData(result.data.age_distribution)
      setGenderData(result.data.gender_distribution)
      setAgeBySourceData(result.data.age_by_source)
      setRevenueByAge(result.data.revenue_by_age)
      setTotalPatients(result.data.total_patients)
      setMostCommonAge(result.data.most_common_age)
      setHighestRevenueAge(result.data.highest_revenue_age)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [clinicId, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ソース一覧を取得
  const sourceList = [...new Set(ageBySourceData.map(d => d.source as string))]

  if (loading && ageData.length === 0) {
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
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            患者属性分析
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            年齢・性別ごとの流入傾向と売上を分析します
          </p>
        </div>
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

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">総患者数</p>
            <p className="text-2xl font-bold">{totalPatients}名</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">男女比</p>
            <p className="text-2xl font-bold">
              <span className="text-blue-600">{genderData[0]?.value || 0}</span>
              <span className="text-gray-400 mx-1">:</span>
              <span className="text-pink-600">{genderData[1]?.value || 0}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">最多年齢層</p>
            <p className="text-2xl font-bold">{mostCommonAge}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">平均単価最高</p>
            <p className="text-2xl font-bold">{highestRevenueAge}</p>
          </CardContent>
        </Card>
      </div>

      {ageData.length === 0 && genderData.length === 0 ? (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            患者属性データがありません。患者情報に生年月日や性別が登録されているか確認してください。
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 年齢・性別分布 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">年齢・性別分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {ageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageData} layout="vertical" margin={{ left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="age" type="category" tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="male" name="男性" fill="#3B82F6" stackId="a" />
                        <Bar dataKey="female" name="女性" fill="#EC4899" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      データがありません
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 性別比率 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">性別構成比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {genderData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      データがありません
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 流入元別年齢分布 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">流入元別 年齢構成</CardTitle>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {sourceList.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {ageBySourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selectedSource === 'all'
                          ? ageBySourceData
                          : ageBySourceData.filter(d => d.source === selectedSource)
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="20代以下" fill="#10B981" stackId="a" />
                        <Bar dataKey="30代" fill="#3B82F6" stackId="a" />
                        <Bar dataKey="40代" fill="#F59E0B" stackId="a" />
                        <Bar dataKey="50代以上" fill="#8B5CF6" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      流入元別データがありません
                    </div>
                  )}
                </div>

                {/* インサイト */}
                {ageBySourceData.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">インサイト</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>流入元ごとの年齢層の傾向を分析し、ターゲット広告の最適化に活用できます</li>
                      <li>特定の流入元に偏りがある場合は、広告のターゲティングを見直すことを検討してください</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 年齢別売上・診療内容 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">年齢層別 平均単価・人気診療</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueByAge.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {revenueByAge.map((item, index) => (
                        <div
                          key={item.age}
                          className="p-4 rounded-lg border bg-gradient-to-br from-white to-gray-50"
                        >
                          <div className="text-center">
                            <Badge
                              variant="outline"
                              className={`mb-2 ${
                                index === revenueByAge.length - 1 ? 'bg-amber-100 text-amber-700 border-amber-200' : ''
                              }`}
                            >
                              {item.age}
                            </Badge>
                            <p className="text-2xl font-bold text-gray-900">
                              ¥{item.avgRevenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">平均単価</p>
                            <p className="text-xs text-gray-400">({item.patientCount}名)</p>

                            {item.topTreatment && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-gray-500">人気診療</p>
                                <p className="text-sm font-medium text-blue-600">{item.topTreatment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 戦略提案 */}
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        マーケティング戦略提案
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                        <div>
                          <p className="font-medium">若年層向け</p>
                          <ul className="list-disc list-inside mt-1">
                            <li>SNS広告でホワイトニング・矯正を訴求</li>
                            <li>分割払いキャンペーンの実施</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium">中高年層向け</p>
                          <ul className="list-disc list-inside mt-1">
                            <li>チラシで歯周病予防を訴求</li>
                            <li>インプラント説明会の案内</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    売上データがありません
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
