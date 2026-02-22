'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp, Users, Target, DollarSign,
  Clock, RefreshCw, Download,
  FileText, Globe, ArrowUpRight, ArrowDownRight, Minus,
  Settings, Megaphone, Wallet, Activity, Stethoscope,
  MousePointerClick, Link, QrCode, MapPin, Code, Link2
} from 'lucide-react'
import { exportToCSV, CSVColumn } from '@/lib/utils/export-csv'
import VisitSourceAnalysisTab from './VisitSourceAnalysisTab'
import { getVisitSourceAnalysis, type VisitSourceAnalysisResult } from '@/lib/api/visit-source-analysis'
import TimeHeatmapChart from './TimeHeatmapChart'
import AdSourcesManager from './AdSourcesManager'
import AdSpendManager from './AdSpendManager'
import TrackingTagsSettings from './TrackingTagsSettings'
import ClientURLGenerator from './ClientURLGenerator'
import QRCodeGenerator from './QRCodeGenerator'
import SNSLinkGenerator from './SNSLinkGenerator'
import TabAnalysisTab from './TabAnalysisTab'
import TabTrackingScriptGenerator from './TabTrackingScriptGenerator'
import MenuBySourceTab from './MenuBySourceTab'
import RegionalAnalysisTab from './RegionalAnalysisTab'
import PatientDemographicsTab from './PatientDemographicsTab'
import HPEmbedCodeGenerator from './HPEmbedCodeGenerator'
import AdPlatformIntegration from './AdPlatformIntegration'

interface IntegratedVisitAnalysisTabProps {
  clinicId: string
  startDate: string
  endDate: string
}

interface ExtendedAnalyticsData {
  period: {
    current: { start: string; end: string; days: number }
    previous: { start: string; end: string; days: number }
  }
  summary: {
    current_total: number
    previous_total: number
    change: number
    change_percentage: number
  }
  by_source: {
    source: string
    current_count: number
    previous_count: number
    change: number
    change_percentage: number
    percentage: number
  }[]
  by_time: {
    by_day: { day: string; count: number; percentage: number }[]
    by_hour: { hour: string; count: number; percentage: number }[]
    matrix: Record<string, Record<string, number>>
  }
  by_cancel: {
    source: string
    total_appointments: number
    cancelled: number
    no_show: number
    cancel_rate: number
    no_show_rate: number
    total_cancel_rate: number
  }[]
  by_repeat: {
    source: string
    total_patients: number
    repeat_patients: number
    repeat_rate: number
    avg_visit_count: number
  }[]
  by_device: {
    device: string
    current_count: number
    previous_count: number
    change: number
    change_percentage: number
    percentage: number
  }[]
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

export default function IntegratedVisitAnalysisTab({
  clinicId,
  startDate,
  endDate
}: IntegratedVisitAnalysisTabProps) {
  const [dataSource, setDataSource] = useState<'questionnaire' | 'web'>('web')
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'time' | 'repeat' | 'behavior' | 'marketing' |
    'menu-by-source' | 'regional' | 'demographics' | 'settings'
  >('overview')
  const [activeSettingsTab, setActiveSettingsTab] = useState<'tag-settings' | 'tab-script' | 'client-url' | 'qr-code' | 'sns-link' | 'hp-embed' | 'ad-sources' | 'ad-integration'>('tag-settings')
  const [behaviorInnerTab, setBehaviorInnerTab] = useState<'funnel' | 'tab-analysis'>('funnel')
  const [marketingInnerTab, setMarketingInnerTab] = useState<'ltv' | 'roi' | 'ad-spend'>('ltv')
  const [loading, setLoading] = useState(false)
  const [webData, setWebData] = useState<ExtendedAnalyticsData | null>(null)
  const [questionnaireData, setQuestionnaireData] = useState<VisitSourceAnalysisResult | null>(null)
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
  }, [clinicId, startDate, endDate, dataSource])

  const loadData = async () => {
    setLoading(true)
    try {
      if (dataSource === 'web') {
        // 拡張分析データを取得
        const res = await fetch(
          `/api/analytics/web-booking-extended?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`
        )
        if (res.ok) {
          const json = await res.json()
          setWebData(json.data)
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

        // 問診表の来院理由データを常に取得（媒体別タブに表示するため）
        const qData = await getVisitSourceAnalysis(clinicId, startDate, endDate)
        setQuestionnaireData(qData)
      } else {
        // questionnaire モードでは web 関連データをリセット
        setWebData(null)
        setFunnelData(null)
        setLtvData(null)
        setRoiData(null)
        const data = await getVisitSourceAnalysis(clinicId, startDate, endDate)
        setQuestionnaireData(data)
      }
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (change < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  // CSVエクスポート
  const exportSourceCSV = () => {
    if (!webData) return
    const columns: CSVColumn[] = [
      { key: 'source', label: '流入元' },
      { key: 'current_count', label: '当期間' },
      { key: 'previous_count', label: '前期間' },
      { key: 'change', label: '増減' },
      { key: 'change_percentage', label: '増減率(%)', format: (v) => v.toFixed(1) },
      { key: 'percentage', label: '構成比(%)', format: (v) => v.toFixed(1) },
    ]
    exportToCSV(webData.by_source, columns, `visit_source_${startDate}_${endDate}.csv`)
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
    exportToCSV(ltvData.source_ltv, columns, `ltv_${startDate}_${endDate}.csv`)
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
    exportToCSV(roiData.roi_by_source, columns, `roi_${startDate}_${endDate}.csv`)
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
      {/* データソース切り替え */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={dataSource === 'web' ? 'default' : 'outline'}
            onClick={() => setDataSource('web')}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Web予約追跡
          </Button>
          <Button
            variant={dataSource === 'questionnaire' ? 'default' : 'outline'}
            onClick={() => setDataSource('questionnaire')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            問診表回答
          </Button>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          更新
        </Button>
      </div>

      {/* 問診表ベースの場合は既存コンポーネントを使用 */}
      {dataSource === 'questionnaire' && questionnaireData && (
        <VisitSourceAnalysisTab data={questionnaireData} loading={loading} />
      )}

      {/* Web予約ベースの場合 */}
      {dataSource === 'web' && (
        <>
          {/* サブタブ */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              <button
                onClick={() => setActiveSubTab('overview')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline-block mr-1" />
                媒体別
              </button>
              <button
                onClick={() => setActiveSubTab('time')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === 'time'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 inline-block mr-1" />
                曜日・時間
              </button>
              <button
                onClick={() => setActiveSubTab('behavior')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === 'behavior'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline-block mr-1" />
                行動分析
              </button>
              <button
                onClick={() => setActiveSubTab('repeat')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === 'repeat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <RefreshCw className="w-4 h-4 inline-block mr-1" />
                リピート
              </button>
              <button
                onClick={() => setActiveSubTab('marketing')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === 'marketing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline-block mr-1" />
                マーケティング
              </button>
              <button
                onClick={() => setActiveSubTab('menu-by-source')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === 'menu-by-source'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Stethoscope className="w-4 h-4 inline-block mr-1" />
                メニュー分析
              </button>
              <button
                onClick={() => setActiveSubTab('regional')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === 'regional'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-4 h-4 inline-block mr-1" />
                地域分析
              </button>
              <button
                onClick={() => setActiveSubTab('demographics')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === 'demographics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline-block mr-1" />
                患者属性
              </button>
              <button
                onClick={() => setActiveSubTab('settings')}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSubTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline-block mr-1" />
                設定
              </button>
            </nav>
          </div>

          {/* 媒体別分析タブ */}
          {activeSubTab === 'overview' && webData && (
            <div className="space-y-6">
              {/* 期間情報 */}
              <div className="text-sm text-gray-500 flex items-center gap-4">
                <span>当期間: {webData.period.current.start} 〜 {webData.period.current.end} ({webData.period.current.days}日間)</span>
                <span>前期間: {webData.period.previous.start} 〜 {webData.period.previous.end}</span>
              </div>

              {/* KPIカード */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">総予約数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {webData.summary.current_total}件
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${getChangeColor(webData.summary.change)}`}>
                      {getChangeIcon(webData.summary.change)}
                      <span>前期比 {webData.summary.change > 0 ? '+' : ''}{webData.summary.change}件</span>
                      <span>({webData.summary.change_percentage > 0 ? '+' : ''}{webData.summary.change_percentage.toFixed(1)}%)</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">前期間</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-500">
                      {webData.summary.previous_total}件
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">流入元数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {webData.by_source.length}種類
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">トップ媒体</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-green-600">
                      {webData.by_source[0]?.source || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {webData.by_source[0]?.current_count || 0}件 ({webData.by_source[0]?.percentage.toFixed(1) || 0}%)
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* エクスポートボタン */}
              <div className="flex justify-end">
                <Button onClick={exportSourceCSV} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  CSVエクスポート
                </Button>
              </div>

              {/* 媒体別テーブル */}
              <Card>
                <CardHeader>
                  <CardTitle>流入元別予約数（期間比較）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">流入元</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">当期間</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">前期間</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">増減</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">構成比</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">グラフ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webData.by_source.map((source, index) => (
                          <tr key={source.source} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium">{source.source}</td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                              {source.current_count}件
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-500">
                              {source.previous_count}件
                            </td>
                            <td className={`px-4 py-3 text-sm text-right ${getChangeColor(source.change)}`}>
                              <div className="flex items-center justify-end gap-1">
                                {getChangeIcon(source.change)}
                                {source.change > 0 ? '+' : ''}{source.change}
                                <span className="text-xs">
                                  ({source.change_percentage > 0 ? '+' : ''}{source.change_percentage.toFixed(0)}%)
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {source.percentage.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${source.percentage}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* デバイス別 */}
              {webData.by_device && webData.by_device.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>デバイス別分析（期間比較）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">デバイス</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">当期間</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">前期間</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">増減</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">構成比</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">グラフ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {webData.by_device.map((device) => (
                            <tr key={device.device} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium capitalize">{device.device}</td>
                              <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                                {device.current_count}件
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-500">
                                {device.previous_count}件
                              </td>
                              <td className={`px-4 py-3 text-sm text-right ${getChangeColor(device.change)}`}>
                                <div className="flex items-center justify-end gap-1">
                                  {getChangeIcon(device.change)}
                                  {device.change > 0 ? '+' : ''}{device.change}
                                  <span className="text-xs">
                                    ({device.change_percentage > 0 ? '+' : ''}{device.change_percentage.toFixed(0)}%)
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                {device.percentage.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-purple-500 h-2 rounded-full transition-all"
                                    style={{ width: `${device.percentage}%` }}
                                  ></div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 問診表による来院理由 */}
              {questionnaireData && questionnaireData.sources && questionnaireData.sources.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      問診表による来院理由
                    </CardTitle>
                    <p className="text-xs text-gray-500">問診回答 {questionnaireData.totalResponses}件</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {questionnaireData.sources.filter(s => s.count > 0).map((item) => (
                        <div key={item.source}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700">{item.source}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">
                                前期 {item.previousCount}件
                              </span>
                              <span className={`text-xs flex items-center gap-0.5 ${item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {item.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : item.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                {item.change > 0 ? '+' : ''}{item.change}
                              </span>
                              <span className="font-medium">{item.count}件</span>
                              <span className="text-xs text-gray-400 w-10 text-right">{item.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 曜日・時間帯タブ */}
          {activeSubTab === 'time' && webData && (
            <Card>
              <CardHeader>
                <CardTitle>曜日・時間帯別分析</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeHeatmapChart data={webData.by_time} />
              </CardContent>
            </Card>
          )}

          {/* リピート分析タブ */}
          {activeSubTab === 'repeat' && webData && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>流入元別リピート率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">流入元</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">患者数</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">リピーター</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">リピート率</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">平均来院数</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">リピート率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {webData.by_repeat.map((item) => (
                          <tr key={item.source} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{item.source}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.total_patients}</td>
                            <td className="px-4 py-3 text-sm text-right text-blue-600">{item.repeat_patients}</td>
                            <td className={`px-4 py-3 text-sm text-right font-bold ${
                              item.repeat_rate > 50 ? 'text-green-600' :
                              item.repeat_rate > 30 ? 'text-blue-600' : 'text-gray-600'
                            }`}>
                              {item.repeat_rate.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-sm text-right">{item.avg_visit_count.toFixed(1)}回</td>
                            <td className="px-4 py-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(item.repeat_rate, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-800">
                    <strong>ヒント:</strong> リピート率が高い媒体は質の高い患者を獲得できています。
                    リピート率の低い媒体は、初回来院後のフォローアップを強化することで改善できます。
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 行動分析タブ（ファネル＋タブ分析） */}
          {activeSubTab === 'behavior' && (
            <div className="space-y-4">
              {/* 行動分析 内部タブ */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                  {[
                    { id: 'funnel', label: 'ファネル分析', icon: Target },
                    { id: 'tab-analysis', label: 'タブクリック分析', icon: MousePointerClick },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setBehaviorInnerTab(id as 'funnel' | 'tab-analysis')}
                      className={`py-2.5 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-1.5 ${
                        behaviorInnerTab === id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* ファネル分析 */}
              {behaviorInnerTab === 'funnel' && (
                <div className="space-y-6">
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
                  <Card>
                    <CardHeader>
                      <CardTitle>予約ファネル</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {funnelData && funnelData.overall_funnel.length > 0 ? (
                          funnelData.overall_funnel.map((step) => (
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

              {/* タブクリック分析 */}
              {behaviorInnerTab === 'tab-analysis' && (
                <TabAnalysisTab clinicId={clinicId} startDate={startDate} endDate={endDate} />
              )}
            </div>
          )}

          {/* マーケティングタブ（LTV・ROI・広告費） */}
          {activeSubTab === 'marketing' && (
            <div className="space-y-4">
              {/* マーケティング 内部タブ */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                  {[
                    { id: 'ltv', label: 'LTV分析', icon: TrendingUp },
                    { id: 'roi', label: 'ROI / ROAS', icon: DollarSign },
                    { id: 'ad-spend', label: '広告費管理', icon: Wallet },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setMarketingInnerTab(id as 'ltv' | 'roi' | 'ad-spend')}
                      className={`py-2.5 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-1.5 ${
                        marketingInnerTab === id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* LTV分析 */}
              {marketingInnerTab === 'ltv' && (
              <div>
                <h3 className="sr-only">顧客生涯価値（LTV）</h3>
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <Button onClick={exportLTVCSV} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      CSVエクスポート
                    </Button>
                  </div>
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
              </div>
              )}

              {/* ROI/ROAS分析 */}
              {marketingInnerTab === 'roi' && (
              <div className="space-y-6">
                  <div className="flex justify-end">
                    <Button onClick={exportROICSV} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      CSVエクスポート
                    </Button>
                  </div>
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

              {/* 広告費管理 */}
              {marketingInnerTab === 'ad-spend' && (
                <AdSpendManager clinicId={clinicId} startDate={startDate} endDate={endDate} />
              )}
            </div>
          )}

          {/* 診療メニュー分析タブ */}
          {activeSubTab === 'menu-by-source' && (
            <MenuBySourceTab clinicId={clinicId} startDate={startDate} endDate={endDate} />
          )}

          {/* 地域分析タブ */}
          {activeSubTab === 'regional' && (
            <RegionalAnalysisTab
              clinicId={clinicId}
              dateRange={{ from: new Date(startDate), to: new Date(endDate) }}
            />
          )}

          {/* 患者属性分析タブ */}
          {activeSubTab === 'demographics' && (
            <PatientDemographicsTab
              clinicId={clinicId}
              dateRange={{ from: new Date(startDate), to: new Date(endDate) }}
            />
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
                    onClick={() => setActiveSettingsTab('sns-link')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeSettingsTab === 'sns-link'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Link className="w-4 h-4 inline-block mr-2" />
                    SNSリンク
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab('hp-embed')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeSettingsTab === 'hp-embed'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Code className="w-4 h-4 inline-block mr-2" />
                    HP埋め込み
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
                  <button
                    onClick={() => setActiveSettingsTab('ad-integration')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeSettingsTab === 'ad-integration'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Link2 className="w-4 h-4 inline-block mr-2" />
                    API連携
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

              {/* SNSリンク生成 */}
              {activeSettingsTab === 'sns-link' && (
                <SNSLinkGenerator clinicId={clinicId} clinicSlug={clinicSlug} />
              )}

              {/* HP埋め込みコード生成 */}
              {activeSettingsTab === 'hp-embed' && (
                <HPEmbedCodeGenerator clinicId={clinicId} clinicSlug={clinicSlug} />
              )}

              {/* 広告媒体管理 */}
              {activeSettingsTab === 'ad-sources' && (
                <AdSourcesManager clinicId={clinicId} />
              )}

              {/* 広告プラットフォームAPI連携 */}
              {activeSettingsTab === 'ad-integration' && (
                <AdPlatformIntegration clinicId={clinicId} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
