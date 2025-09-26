'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart3, Calendar, Users, AlertTriangle } from 'lucide-react'
import { getCancelAnalysis, CancelAnalysisData } from '@/lib/api/cancel-analysis'

export default function AnalyticsPage() {
  const [analysisData, setAnalysisData] = useState<CancelAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // デフォルトの日付範囲を設定（過去30日）
  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  // 分析データを取得
  const loadAnalysisData = async () => {
    if (!startDate || !endDate) return

    try {
      setLoading(true)
      const data = await getCancelAnalysis('11111111-1111-1111-1111-111111111111', startDate, endDate)
      setAnalysisData(data)
    } catch (error) {
      console.error('分析データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      loadAnalysisData()
    }
  }, [startDate, endDate])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">分析</h1>
          <p className="text-gray-600 mt-1">キャンセル分析と統計情報</p>
        </div>
        <BarChart3 className="w-8 h-8 text-blue-600" />
      </div>

      {/* 期間選択 */}
      <Card>
        <CardHeader>
          <CardTitle>分析期間</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">開始日</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">終了日</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={loadAnalysisData} disabled={loading}>
                {loading ? '読み込み中...' : '更新'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* サマリー統計 */}
      {analysisData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総キャンセル数</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisData.total_cancelled}</div>
              <p className="text-xs text-muted-foreground">
                期間内の総キャンセル数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本登録キャンセル</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analysisData.registered_cancelled}</div>
              <p className="text-xs text-muted-foreground">
                本登録患者のキャンセル数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">仮登録キャンセル</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{analysisData.temporary_cancelled}</div>
              <p className="text-xs text-muted-foreground">
                仮登録患者のキャンセル数
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* キャンセル理由別分析 */}
      {analysisData && analysisData.reasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>キャンセル理由別分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisData.reasons.map((reason, index) => (
                <div key={reason.reason_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{reason.reason_name}</h3>
                    <span className="text-sm text-gray-500">総数: {reason.count}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>本登録: {reason.registered_count}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>仮登録: {reason.temporary_count}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(reason.count / analysisData.total_cancelled) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((reason.count / analysisData.total_cancelled) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日別統計 */}
      {analysisData && analysisData.daily_stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>日別キャンセル統計</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysisData.daily_stats.map((daily, index) => (
                <div key={daily.date} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">{daily.date}</span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-blue-600">本登録: {daily.registered_cancelled}</span>
                      <span className="text-orange-600">仮登録: {daily.temporary_cancelled}</span>
                    </div>
                  </div>
                  <span className="font-bold text-lg">{daily.total_cancelled}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* データなしの場合 */}
      {analysisData && analysisData.total_cancelled === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">キャンセルデータがありません</h3>
            <p className="text-gray-500">
              選択した期間内にキャンセルされた予約がありません。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}