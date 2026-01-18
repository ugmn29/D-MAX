'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, TrendingUp, Users, DollarSign, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'

interface RegionalAnalysisTabProps {
  clinicId: string
  dateRange: { from: Date; to: Date }
}

interface AreaData {
  prefecture: string
  city: string
  district: string
  patientCount: number
  newPatientCount: number
  totalRevenue: number
  avgRevenue: number
  topTreatments: { name: string; count: number }[]
  latitude?: number
  longitude?: number
  avgDistance?: number
}

interface RegionalApiResponse {
  data: {
    areas: AreaData[]
    total_patients: number
    total_new_patients: number
    total_revenue?: number
    geocoded_count: number
    needs_geocoding: boolean
  }
}

export default function RegionalAnalysisTab({ clinicId, dateRange }: RegionalAnalysisTabProps) {
  const [areaData, setAreaData] = useState<AreaData[]>([])
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'patientCount' | 'revenue' | 'newPatient'>('patientCount')
  const [selectedArea, setSelectedArea] = useState<AreaData | null>(null)
  const [needsGeocoding, setNeedsGeocoding] = useState(false)
  const [geocodedCount, setGeocodedCount] = useState(0)
  const [totalPatients, setTotalPatients] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)

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

      const response = await fetch(`/api/analytics/regional?${params}`)

      if (!response.ok) {
        throw new Error('データの取得に失敗しました')
      }

      const result: RegionalApiResponse = await response.json()

      setAreaData(result.data.areas)
      setNeedsGeocoding(result.data.needs_geocoding)
      setGeocodedCount(result.data.geocoded_count)
      setTotalPatients(result.data.total_patients)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [clinicId, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // バッチジオコーディング実行
  const runGeocoding = async () => {
    setGeocoding(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinic_id: clinicId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'ジオコーディングに失敗しました')
      }

      const result = await response.json()

      // 成功したら再度データを取得
      await fetchData()

      alert(`${result.processed}件の住所を処理しました（成功: ${result.success}, 失敗: ${result.failed}）`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ジオコーディングエラー')
    } finally {
      setGeocoding(false)
    }
  }

  const sortedData = [...areaData].sort((a, b) => {
    switch (sortBy) {
      case 'patientCount':
        return b.patientCount - a.patientCount
      case 'revenue':
        return b.totalRevenue - a.totalRevenue
      case 'newPatient':
        return b.newPatientCount - a.newPatientCount
      default:
        return 0
    }
  })

  const totalStats = {
    totalPatients: areaData.reduce((sum, a) => sum + a.patientCount, 0),
    totalNewPatients: areaData.reduce((sum, a) => sum + a.newPatientCount, 0),
    totalRevenue: areaData.reduce((sum, a) => sum + a.totalRevenue, 0),
  }

  const maxPatientCount = Math.max(...areaData.map(a => a.patientCount), 1)

  if (loading && areaData.length === 0) {
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
            <MapPin className="w-5 h-5" />
            地域別分析
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            患者の住所データから地域別の流入・売上を分析します
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ジオコーディング案内 */}
      {needsGeocoding && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800">
              住所から座標への変換が未完了の患者がいます。ジオコーディングを実行すると、より詳細な地域分析が可能になります。
            </span>
            <Button
              size="sm"
              onClick={runGeocoding}
              disabled={geocoding}
              className="ml-4"
            >
              {geocoding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-1" />
                  ジオコーディング実行
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">分析対象患者</p>
                <p className="text-2xl font-bold">{totalStats.totalPatients}名</p>
                {geocodedCount > 0 && (
                  <p className="text-xs text-gray-500">
                    座標取得済み: {geocodedCount}名
                  </p>
                )}
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">新規患者</p>
                <p className="text-2xl font-bold">{totalStats.totalNewPatients}名</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総売上</p>
                <p className="text-2xl font-bold">¥{totalStats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">分析エリア数</p>
                <p className="text-2xl font-bold">{areaData.length}箇所</p>
              </div>
              <MapPin className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {areaData.length === 0 ? (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            地域データがありません。患者の住所情報が登録されているか確認してください。
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ヒートマップ表示エリア */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">患者分布ヒートマップ</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={mapRef}
                className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden"
              >
                {/* 簡易的なヒートマップ表示 */}
                <div className="absolute inset-0 p-4">
                  <svg viewBox="0 0 400 400" className="w-full h-full">
                    {/* 背景 */}
                    <rect x="0" y="0" width="400" height="400" fill="#e5e7eb" />

                    {/* ヒートマップポイント */}
                    {areaData.slice(0, 12).map((area, index) => {
                      // 緯度経度がある場合は相対位置を計算
                      let x: number, y: number
                      if (area.latitude && area.longitude && areaData.some(a => a.latitude)) {
                        const lats = areaData.filter(a => a.latitude).map(a => a.latitude!)
                        const lngs = areaData.filter(a => a.longitude).map(a => a.longitude!)
                        const minLat = Math.min(...lats)
                        const maxLat = Math.max(...lats)
                        const minLng = Math.min(...lngs)
                        const maxLng = Math.max(...lngs)

                        const latRange = maxLat - minLat || 0.01
                        const lngRange = maxLng - minLng || 0.01

                        x = 50 + ((area.longitude - minLng) / lngRange) * 300
                        y = 50 + ((maxLat - area.latitude) / latRange) * 300
                      } else {
                        // 座標がない場合はグリッド配置
                        x = 80 + (index % 4) * 80
                        y = 80 + Math.floor(index / 4) * 100
                      }

                      const radius = Math.min((area.patientCount / maxPatientCount) * 50 + 15, 60)
                      const opacity = 0.3 + (area.patientCount / maxPatientCount) * 0.5

                      return (
                        <g key={`${area.prefecture}-${area.city}-${area.district}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r={radius}
                            fill={`rgba(239, 68, 68, ${opacity})`}
                            className="cursor-pointer hover:stroke-red-600 hover:stroke-2"
                            onClick={() => setSelectedArea(area)}
                          />
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs font-medium fill-gray-800 pointer-events-none"
                            style={{ fontSize: '10px' }}
                          >
                            {area.district || area.city}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* 凡例 */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-200" />
                    <span>少</span>
                    <div className="w-4 h-4 rounded-full bg-red-400" />
                    <span>中</span>
                    <div className="w-4 h-4 rounded-full bg-red-600" />
                    <span>多</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                円の大きさは患者数を表しています。クリックで詳細を表示します。
              </p>
            </CardContent>
          </Card>

          {/* 地域別リスト */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">地域別ランキング</CardTitle>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patientCount">患者数順</SelectItem>
                    <SelectItem value="revenue">売上順</SelectItem>
                    <SelectItem value="newPatient">新規順</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {sortedData.map((area, index) => (
                  <div
                    key={`${area.prefecture}-${area.city}-${area.district}`}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedArea?.district === area.district && selectedArea?.city === area.city
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedArea(area)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">
                            {area.city} {area.district || ''}
                          </p>
                          <p className="text-xs text-gray-500">{area.prefecture}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{area.patientCount}名</p>
                        <p className="text-xs text-gray-500">
                          新規 {area.newPatientCount}名
                        </p>
                      </div>
                    </div>

                    {/* 進捗バー */}
                    <div className="mt-2">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(area.patientCount / maxPatientCount) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 売上表示 */}
                    {area.totalRevenue > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        売上: ¥{area.totalRevenue.toLocaleString()}
                        （平均: ¥{area.avgRevenue.toLocaleString()}）
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 選択エリアの詳細 */}
      {selectedArea && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              {selectedArea.city} {selectedArea.district || ''} の詳細
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">患者数</p>
                <p className="text-2xl font-bold text-blue-600">{selectedArea.patientCount}名</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">新規患者</p>
                <p className="text-2xl font-bold text-green-600">{selectedArea.newPatientCount}名</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600">総売上</p>
                <p className="text-2xl font-bold text-amber-600">
                  ¥{selectedArea.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">平均単価</p>
                <p className="text-2xl font-bold text-purple-600">
                  ¥{selectedArea.avgRevenue.toLocaleString()}
                </p>
              </div>
            </div>

            {selectedArea.avgDistance !== undefined && selectedArea.avgDistance > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  医院からの平均距離: <strong>{selectedArea.avgDistance.toFixed(1)}km</strong>
                </p>
              </div>
            )}

            {selectedArea.topTreatments && selectedArea.topTreatments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">人気の診療内容</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedArea.topTreatments.map((treatment) => (
                    <Badge key={treatment.name} variant="secondary">
                      {treatment.name} ({treatment.count}件)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 活用ヒント */}
      <Alert>
        <AlertDescription className="text-sm">
          <strong>活用ヒント:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>患者数が多い地域</strong>: ポスティングチラシの重点エリアに設定</li>
            <li><strong>患者数が少ない地域</strong>: 新規開拓のターゲットエリアとして検討</li>
            <li><strong>売上が高い地域</strong>: 高単価メニューの訴求が効果的</li>
            <li><strong>新規が多い地域</strong>: 広告効果が高い可能性あり</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
