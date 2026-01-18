'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign, Target, MousePointerClick, Wallet, Settings, Link, QrCode, Download, Activity, Stethoscope, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdSpendManager from './AdSpendManager'
import TrackingTagsSettings from './TrackingTagsSettings'
import ClientURLGenerator from './ClientURLGenerator'
import QRCodeGenerator from './QRCodeGenerator'
import TabAnalysisTab from './TabAnalysisTab'
import TabTrackingScriptGenerator from './TabTrackingScriptGenerator'
import MenuBySourceTab from './MenuBySourceTab'
import AdSourcesManager from './AdSourcesManager'
import { exportToCSV, CSVColumn } from '@/lib/utils/export-csv'

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

interface SourceLTVData {
  source: string
  patient_count: number
  total_revenue: number
  avg_ltv: number
  avg_visit_count: number
  avg_revenue_per_visit: number
}

interface ROIData {
  source: string
  ad_spend: number
  patient_count: number
  total_revenue: number
  roi: number
  roas: number
  cpa: number
  avg_ltv: number
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
  const [ltvData, setLtvData] = useState<{
    source_ltv: SourceLTVData[]
    total_patients: number
    total_revenue: number
    avg_ltv: number
  } | null>(null)
  const [roiData, setRoiData] = useState<{
    roi_by_source: ROIData[]
    total_ad_spend: number
    total_revenue: number
    overall_roi: number
    overall_roas: number
    overall_cpa: number
  } | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<'acquisition' | 'funnel' | 'ltv' | 'roi' | 'ad-spend' | 'tab-analysis' | 'menu-by-source' | 'settings'>('acquisition')
  const [activeSettingsTab, setActiveSettingsTab] = useState<'tag-settings' | 'tab-script' | 'client-url' | 'qr-code' | 'ad-sources'>('tag-settings')
  const [clinicSlug, setClinicSlug] = useState<string>('')

  // クリニックスラッグを取得
  useEffect(() => {
    const loadClinicSlug = async () => {
      try {
        const res = await fetch(`/api/clinics/${clinicId}`)
        if (res.ok) {
          const data = await res.json()
          setClinicSlug(data.slug || '')
        }
      } catch (error) {
        console.error('クリニック情報取得エラー:', error)
      }
    }
    loadClinicSlug()
  }, [clinicId])

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

      // LTVデータを取得
      const ltvRes = await fetch(
        `/api/analytics/ltv?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`
      )
      if (ltvRes.ok) {
        const ltvJson = await ltvRes.json()
        setLtvData(ltvJson.data)
      }

      // ROIデータを取得
      const roiRes = await fetch(
        `/api/analytics/roi?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`
      )
      if (roiRes.ok) {
        const roiJson = await roiRes.json()
        setRoiData(roiJson.data)
      }
    } catch (error) {
      console.error('Web予約効果データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // CSVエクスポート関数
  const exportAcquisitionCSV = () => {
    if (!acquisitionData) return

    const columns: CSVColumn[] = [
      { key: 'source', label: '流入元' },
      { key: 'count', label: '予約数' },
      { key: 'utm_count', label: 'UTM追跡数' },
      { key: 'questionnaire_count', label: 'アンケート回答数' },
      { key: 'percentage', label: '割合(%)', format: (v) => v.toFixed(1) }
    ]

    const filename = `acquisition_${startDate}_${endDate}.csv`
    exportToCSV(acquisitionData.by_source, columns, filename)
  }

  const exportLTVCSV = () => {
    if (!ltvData) return

    const columns: CSVColumn[] = [
      { key: 'source', label: '流入元' },
      { key: 'patient_count', label: '患者数' },
      { key: 'total_revenue', label: '総売上', format: (v) => `¥${v.toLocaleString()}` },
      { key: 'avg_ltv', label: '平均LTV', format: (v) => `¥${v.toLocaleString()}` },
      { key: 'avg_visit_count', label: '平均来院数', format: (v) => v.toFixed(1) },
      { key: 'avg_revenue_per_visit', label: '平均来院単価', format: (v) => `¥${v.toLocaleString()}` }
    ]

    const filename = `ltv_${startDate}_${endDate}.csv`
    exportToCSV(ltvData.source_ltv, columns, filename)
  }

  const exportROICSV = () => {
    if (!roiData) return

    const columns: CSVColumn[] = [
      { key: 'source', label: '流入元' },
      { key: 'ad_spend', label: '広告費', format: (v) => `¥${v.toLocaleString()}` },
      { key: 'patient_count', label: '患者数' },
      { key: 'total_revenue', label: '売上', format: (v) => `¥${v.toLocaleString()}` },
      { key: 'roi', label: 'ROI(%)', format: (v) => v.toFixed(1) },
      { key: 'roas', label: 'ROAS', format: (v) => v.toFixed(2) },
      { key: 'cpa', label: 'CPA', format: (v) => `¥${v.toLocaleString()}` },
      { key: 'avg_ltv', label: '平均LTV', format: (v) => `¥${v.toLocaleString()}` }
    ]

    const filename = `roi_${startDate}_${endDate}.csv`
    exportToCSV(roiData.roi_by_source, columns, filename)
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
          <button
            onClick={() => setActiveSubTab('ltv')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'ltv'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-2" />
            LTV分析
          </button>
          <button
            onClick={() => setActiveSubTab('roi')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'roi'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DollarSign className="w-4 h-4 inline-block mr-2" />
            ROI/ROAS分析
          </button>
          <button
            onClick={() => setActiveSubTab('ad-spend')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'ad-spend'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Wallet className="w-4 h-4 inline-block mr-2" />
            広告費管理
          </button>
          <button
            onClick={() => setActiveSubTab('tab-analysis')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'tab-analysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline-block mr-2" />
            タブ分析
          </button>
          <button
            onClick={() => setActiveSubTab('menu-by-source')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'menu-by-source'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Stethoscope className="w-4 h-4 inline-block mr-2" />
            診療メニュー分析
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline-block mr-2" />
            設定
          </button>
        </nav>
      </div>

      {/* 獲得経路分析タブ */}
      {activeSubTab === 'acquisition' && (
        <div className="space-y-6">
          {/* エクスポートボタン */}
          <div className="flex justify-end">
            <Button onClick={exportAcquisitionCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSVエクスポート
            </Button>
          </div>

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

      {/* LTV分析タブ */}
      {activeSubTab === 'ltv' && (
        <div className="space-y-6">
          {/* エクスポートボタン */}
          <div className="flex justify-end">
            <Button onClick={exportLTVCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSVエクスポート
            </Button>
          </div>

          {/* LTV KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">総患者数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {ltvData?.total_patients || 0}人
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">総売上</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ¥{(ltvData?.total_revenue || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">平均LTV</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ¥{(ltvData?.avg_ltv || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 流入元別LTV */}
          <Card>
            <CardHeader>
              <CardTitle>流入元別LTV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ltvData && ltvData.source_ltv.length > 0 ? (
                  ltvData.source_ltv.map((source, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                          <span className="font-medium text-gray-900">{source.source}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">患者数: {source.patient_count}</span>
                          <span className="text-gray-500">来院数: {source.avg_visit_count.toFixed(1)}</span>
                          <span className="font-bold text-green-600">¥{source.avg_ltv.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <div>総売上: ¥{source.total_revenue.toLocaleString()}</div>
                        <div>平均来院単価: ¥{source.avg_revenue_per_visit.toLocaleString()}</div>
                        <div>平均LTV: ¥{source.avg_ltv.toLocaleString()}</div>
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

      {/* ROI/ROAS分析タブ */}
      {activeSubTab === 'roi' && (
        <div className="space-y-6">
          {/* エクスポートボタン */}
          <div className="flex justify-end">
            <Button onClick={exportROICSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSVエクスポート
            </Button>
          </div>

          {/* ROI KPI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">総広告費</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ¥{(roiData?.total_ad_spend || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">総売上</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ¥{(roiData?.total_revenue || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(roiData?.overall_roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(roiData?.overall_roi || 0).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">ROAS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(roiData?.overall_roas || 0).toFixed(2)}x
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 流入元別ROI */}
          <Card>
            <CardHeader>
              <CardTitle>流入元別ROI/ROAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">流入元</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">広告費</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">患者数</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">売上</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">ROI</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">ROAS</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">CPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiData && roiData.roi_by_source.length > 0 ? (
                      roiData.roi_by_source.map((source, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{source.source}</td>
                          <td className="px-4 py-3 text-sm text-right">¥{source.ad_spend.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-right">{source.patient_count}</td>
                          <td className="px-4 py-3 text-sm text-right">¥{source.total_revenue.toLocaleString()}</td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${source.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {source.roi.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                            {source.roas.toFixed(2)}x
                          </td>
                          <td className="px-4 py-3 text-sm text-right">¥{source.cpa.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          データがありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 説明 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-sm space-y-1">
                <p><strong>ROI (Return on Investment)</strong>: (売上 - 広告費) ÷ 広告費 × 100</p>
                <p><strong>ROAS (Return on Ad Spend)</strong>: 売上 ÷ 広告費</p>
                <p><strong>CPA (Cost Per Acquisition)</strong>: 広告費 ÷ 獲得患者数</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 広告費管理タブ */}
      {activeSubTab === 'ad-spend' && (
        <AdSpendManager clinicId={clinicId} startDate={startDate} endDate={endDate} />
      )}

      {/* タブ分析タブ */}
      {activeSubTab === 'tab-analysis' && (
        <TabAnalysisTab clinicId={clinicId} startDate={startDate} endDate={endDate} />
      )}

      {/* 診療メニュー分析タブ */}
      {activeSubTab === 'menu-by-source' && (
        <MenuBySourceTab clinicId={clinicId} startDate={startDate} endDate={endDate} />
      )}

      {/* 設定タブ */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          {/* 設定サブタブ */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveSettingsTab('tag-settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSettingsTab === 'tag-settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline-block mr-2" />
                タグ設定
              </button>
              <button
                onClick={() => setActiveSettingsTab('tab-script')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSettingsTab === 'tab-script'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MousePointerClick className="w-4 h-4 inline-block mr-2" />
                タブスクリプト
              </button>
              <button
                onClick={() => setActiveSettingsTab('client-url')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSettingsTab === 'client-url'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Link className="w-4 h-4 inline-block mr-2" />
                クライアントURL
              </button>
              <button
                onClick={() => setActiveSettingsTab('qr-code')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSettingsTab === 'qr-code'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <QrCode className="w-4 h-4 inline-block mr-2" />
                QRコード生成
              </button>
              <button
                onClick={() => setActiveSettingsTab('ad-sources')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSettingsTab === 'ad-sources'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Megaphone className="w-4 h-4 inline-block mr-2" />
                広告媒体
              </button>
            </nav>
          </div>

          {/* タグ設定 */}
          {activeSettingsTab === 'tag-settings' && (
            <TrackingTagsSettings clinicId={clinicId} />
          )}

          {/* タブスクリプト生成 */}
          {activeSettingsTab === 'tab-script' && (
            <TabTrackingScriptGenerator clinicId={clinicId} />
          )}

          {/* クライアントURL */}
          {activeSettingsTab === 'client-url' && (
            <ClientURLGenerator clinicId={clinicId} />
          )}

          {/* QRコード生成 */}
          {activeSettingsTab === 'qr-code' && (
            <QRCodeGenerator clinicId={clinicId} clinicSlug={clinicSlug} />
          )}

          {/* 広告媒体管理 */}
          {activeSettingsTab === 'ad-sources' && (
            <AdSourcesManager clinicId={clinicId} />
          )}
        </div>
      )}
    </div>
  )
}
