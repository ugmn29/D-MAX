'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign, Target, MousePointerClick } from 'lucide-react'

interface WebBookingEffectTabProps {
  clinicId: string
  startDate: string
  endDate: string
}

interface AcquisitionSourceData {
  source: string
  count: number
  utm_count: number
  questionnaire_count: number
  percentage: number
}

interface DeviceData {
  device: string
  count: number
  percentage: number
}

interface FunnelStepData {
  step_number: number
  step_name: string
  step_label: string
  session_count: number
  drop_off_count: number
  drop_off_rate: number
  conversion_rate: number
}

export default function WebBookingEffectTab({ clinicId, startDate, endDate }: WebBookingEffectTabProps) {
  const [loading, setLoading] = useState(false)
  const [acquisitionData, setAcquisitionData] = useState<{
    total_count: number
    by_source: AcquisitionSourceData[]
    by_device: DeviceData[]
  } | null>(null)
  const [funnelData, setFunnelData] = useState<{
    overall_funnel: FunnelStepData[]
    total_sessions: number
    completed_sessions: number
    overall_completion_rate: number
  } | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'acquisition' | 'funnel'>('acquisition')

  useEffect(() => {
    loadData()
  }, [clinicId, startDate, endDate])

  const loadData = async () => {
    try {
      setLoading(true)

      // 獲得経路データを取得
      const acquisitionRes = await fetch(
        `/api/analytics/acquisition-sources?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`
      )
      if (acquisitionRes.ok) {
        const acquisitionJson = await acquisitionRes.json()
        setAcquisitionData(acquisitionJson.data)
      }

      // ファネルデータを取得
      const funnelRes = await fetch(
        `/api/analytics/funnel?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`
      )
      if (funnelRes.ok) {
        const funnelJson = await funnelRes.json()
        setFunnelData(funnelJson.data)
      }
    } catch (error) {
      console.error('Web予約効果データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* サブタブ */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('acquisition')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'acquisition'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            獲得経路分析
          </button>
          <button
            onClick={() => setActiveSubTab('funnel')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'funnel'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target className="w-4 h-4 inline-block mr-2" />
            予約ファネル分析
          </button>
        </nav>
      </div>

      {/* 獲得経路分析タブ */}
      {activeSubTab === 'acquisition' && (
        <div className="space-y-6">
          {/* KPIカード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">総予約数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {acquisitionData?.total_count || 0}件
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">UTM追跡</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {acquisitionData?.by_source.reduce((sum, s) => sum + s.utm_count, 0) || 0}件
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {acquisitionData && acquisitionData.total_count > 0
                    ? `${((acquisitionData.by_source.reduce((sum, s) => sum + s.utm_count, 0) / acquisitionData.total_count) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">アンケート回答</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {acquisitionData?.by_source.reduce((sum, s) => sum + s.questionnaire_count, 0) || 0}件
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {acquisitionData && acquisitionData.total_count > 0
                    ? `${((acquisitionData.by_source.reduce((sum, s) => sum + s.questionnaire_count, 0) / acquisitionData.total_count) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 流入元別予約数 */}
          <Card>
            <CardHeader>
              <CardTitle>流入元別予約数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {acquisitionData && acquisitionData.by_source.length > 0 ? (
                  acquisitionData.by_source.map((source, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                          <span className="font-medium text-gray-900">{source.source}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-xs text-gray-500">
                            UTM: {source.utm_count} / アンケート: {source.questionnaire_count}
                          </div>
                          <span className="text-sm text-gray-500">{source.percentage.toFixed(1)}%</span>
                          <span className="font-bold text-blue-600">{source.count}件</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${source.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* デバイス別予約数 */}
          <Card>
            <CardHeader>
              <CardTitle>デバイス別予約数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {acquisitionData && acquisitionData.by_device.length > 0 ? (
                  acquisitionData.by_device.map((device, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 capitalize">{device.device}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{device.percentage.toFixed(1)}%</span>
                          <span className="font-bold text-blue-600">{device.count}件</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${device.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ファネル分析タブ */}
      {activeSubTab === 'funnel' && (
        <div className="space-y-6">
          {/* ファネルKPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">総セッション数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {funnelData?.total_sessions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">予約完了数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {funnelData?.completed_sessions || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">完了率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {funnelData?.overall_completion_rate.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ファネルチャート */}
          <Card>
            <CardHeader>
              <CardTitle>予約ファネル</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData && funnelData.overall_funnel.length > 0 ? (
                  funnelData.overall_funnel.map((step, index) => (
                    <div key={step.step_number} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {step.step_number}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{step.step_label}</div>
                            <div className="text-xs text-gray-500">{step.step_name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {step.drop_off_count > 0 && (
                            <div className="text-xs text-red-600">
                              離脱: {step.drop_off_count} ({step.drop_off_rate.toFixed(1)}%)
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            {step.conversion_rate.toFixed(1)}%
                          </div>
                          <div className="font-bold text-blue-600 w-16 text-right">
                            {step.session_count}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 relative">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all flex items-center justify-end pr-2"
                          style={{ width: `${step.conversion_rate}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {step.conversion_rate.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
