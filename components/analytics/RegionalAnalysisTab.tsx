'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
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

const MAP_CONTAINER_STYLE = { width: '100%', height: '400px' }
const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 } // 東京
const DEFAULT_ZOOM = 10

export default function RegionalAnalysisTab({ clinicId, dateRange }: RegionalAnalysisTabProps) {
  const [areaData, setAreaData] = useState<AreaData[]>([])
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'patientCount' | 'revenue' | 'newPatient'>('patientCount')
  const [selectedArea, setSelectedArea] = useState<AreaData | null>(null)
  const [needsGeocoding, setNeedsGeocoding] = useState(false)
  const [geocodedCount, setGeocodedCount] = useState(0)
  const [infoWindowArea, setInfoWindowArea] = useState<AreaData | null>(null)

  const mapRef = useRef<google.maps.Map | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [clinicId, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // マーカーをマップに描画
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return

    // 既存マーカーをクリア
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
    }

    const geocodedAreas = areaData.filter(a => a.latitude && a.longitude)
    if (geocodedAreas.length === 0) return

    const maxCount = Math.max(...geocodedAreas.map(a => a.patientCount), 1)

    const markers = geocodedAreas.map(area => {
      const scale = 8 + (area.patientCount / maxCount) * 16
      const opacity = 0.5 + (area.patientCount / maxCount) * 0.5

      const marker = new google.maps.Marker({
        position: { lat: area.latitude!, lng: area.longitude! },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale,
          fillColor: '#3B82F6',
          fillOpacity: opacity,
          strokeColor: '#1D4ED8',
          strokeWeight: 1.5,
        },
        title: `${area.city} ${area.district || ''} (${area.patientCount}名)`,
      })

      marker.addListener('click', () => {
        setInfoWindowArea(area)
        setSelectedArea(area)
      })

      return marker
    })

    markersRef.current = markers

    clustererRef.current = new MarkerClusterer({
      map: mapRef.current,
      markers,
    })

    // 地図の表示範囲を患者データに合わせる
    const bounds = new google.maps.LatLngBounds()
    geocodedAreas.forEach(a => bounds.extend({ lat: a.latitude!, lng: a.longitude! }))
    mapRef.current.fitBounds(bounds)
  }, [areaData, isLoaded])

  // バッチジオコーディング実行
  const runGeocoding = async () => {
    setGeocoding(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics/geocode?clinic_id=${clinicId}`, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'ジオコーディングに失敗しました')
      }

      const result = await response.json()
      await fetchData()
      alert(`${result.processed}件の住所を処理しました（未処理: ${result.total_uncached}件）`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ジオコーディングエラー')
    } finally {
      setGeocoding(false)
    }
  }

  const sortedData = [...areaData].sort((a, b) => {
    switch (sortBy) {
      case 'patientCount': return b.patientCount - a.patientCount
      case 'revenue': return b.totalRevenue - a.totalRevenue
      case 'newPatient': return b.newPatientCount - a.newPatientCount
      default: return 0
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
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
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

      {/* ジオコーディング案内 */}
      {needsGeocoding && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800">
              住所から座標への変換が未完了の患者がいます。ジオコーディングを実行すると、より詳細な地域分析が可能になります。
            </span>
            <Button size="sm" onClick={runGeocoding} disabled={geocoding} className="ml-4">
              {geocoding ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" />処理中...</>
              ) : (
                <><MapPin className="w-4 h-4 mr-1" />ジオコーディング実行</>
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
                  <p className="text-xs text-gray-500">座標取得済み: {geocodedCount}名</p>
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
          {/* Google マップ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">患者分布マップ</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={MAP_CONTAINER_STYLE}
                  center={DEFAULT_CENTER}
                  zoom={DEFAULT_ZOOM}
                  onLoad={map => { mapRef.current = map }}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                  }}
                >
                  {infoWindowArea && infoWindowArea.latitude && infoWindowArea.longitude && (
                    <InfoWindow
                      position={{ lat: infoWindowArea.latitude, lng: infoWindowArea.longitude }}
                      onCloseClick={() => setInfoWindowArea(null)}
                    >
                      <div className="p-2 min-w-[160px]">
                        <p className="font-bold text-sm">
                          {infoWindowArea.city} {infoWindowArea.district || ''}
                        </p>
                        <p className="text-xs text-gray-500">{infoWindowArea.prefecture}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <p>患者数: <strong>{infoWindowArea.patientCount}名</strong></p>
                          <p>新規: <strong>{infoWindowArea.newPatientCount}名</strong></p>
                          {infoWindowArea.totalRevenue > 0 && (
                            <p>売上: <strong>¥{infoWindowArea.totalRevenue.toLocaleString()}</strong></p>
                          )}
                          {infoWindowArea.avgDistance != null && infoWindowArea.avgDistance > 0 && (
                            <p>医院からの距離: <strong>{infoWindowArea.avgDistance.toFixed(1)}km</strong></p>
                          )}
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                マーカーをクリックすると詳細を表示します。ズームインすると町名・番地レベルで確認できます。
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
                    onClick={() => {
                      setSelectedArea(area)
                      if (area.latitude && area.longitude && mapRef.current) {
                        mapRef.current.panTo({ lat: area.latitude, lng: area.longitude })
                        mapRef.current.setZoom(15)
                        setInfoWindowArea(area)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{area.city} {area.district || ''}</p>
                          <p className="text-xs text-gray-500">{area.prefecture}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{area.patientCount}名</p>
                        <p className="text-xs text-gray-500">新規 {area.newPatientCount}名</p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(area.patientCount / maxPatientCount) * 100}%` }}
                        />
                      </div>
                    </div>

                    {area.totalRevenue > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        売上: ¥{area.totalRevenue.toLocaleString()}（平均: ¥{area.avgRevenue.toLocaleString()}）
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
                <p className="text-2xl font-bold text-amber-600">¥{selectedArea.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">平均単価</p>
                <p className="text-2xl font-bold text-purple-600">¥{selectedArea.avgRevenue.toLocaleString()}</p>
              </div>
            </div>

            {selectedArea.avgDistance != null && selectedArea.avgDistance > 0 && (
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
