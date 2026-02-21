'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Activity, Target } from 'lucide-react'
import { getAnalyticsData, AnalyticsData, getCancelAnalysisData, getTimeSlotCancelAnalysis, getStaffCancelAnalysis, getTreatmentCancelAnalysis, getTreatmentMenuStatsByParent, CancelAnalysisData, TimeSlotCancelData, StaffCancelData, TreatmentCancelData, TreatmentMenuStats } from '@/lib/api/analytics'
import TrainingAnalyticsTab from '@/components/analytics/TrainingAnalyticsTab'
import StaffAnalyticsTab from '@/components/analytics/StaffAnalyticsTab'
import IntegratedVisitAnalysisTab from '@/components/analytics/IntegratedVisitAnalysisTab'
import { SalesAnalyticsTab } from '@/components/analytics/SalesAnalyticsTab'
import { useClinicId } from '@/hooks/use-clinic-id'

export default function AnalyticsPage() {
  const clinicId = useClinicId()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [cancelAnalysisData, setCancelAnalysisData] = useState<CancelAnalysisData | null>(null)
  const [timeSlotCancelData, setTimeSlotCancelData] = useState<TimeSlotCancelData[]>([])
  const [staffCancelData, setStaffCancelData] = useState<StaffCancelData[]>([])
  const [treatmentCancelData, setTreatmentCancelData] = useState<TreatmentCancelData[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const [comparisonType, setComparisonType] = useState<'previous' | 'same_period_last_year' | 'none'>('previous')
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1)
  const [drilldownMenus, setDrilldownMenus] = useState<TreatmentMenuStats[]>([])
  const [menuBreadcrumb, setMenuBreadcrumb] = useState<{id: string, name: string, level: number}[]>([])

  // デフォルトの日付範囲を設定（今月）
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    
    setEndDate(today.toISOString().split('T')[0])
    setStartDate(firstDay.toISOString().split('T')[0])
  }, [])

  // 分析データを取得
  const loadAnalyticsData = async () => {
    if (!startDate || !endDate) return

    try {
      setLoading(true)

      // 基本分析データを取得（比較タイプを渡す、期間は常に日別）
      const data = await getAnalyticsData(clinicId, startDate, endDate, 'daily', comparisonType)
      setAnalyticsData(data)

      // キャンセル分析データを取得
      const cancelData = await getCancelAnalysisData(clinicId, startDate, endDate)
      setCancelAnalysisData(cancelData)

      // 詳細キャンセル分析データを取得
      const timeSlotData = await getTimeSlotCancelAnalysis(clinicId, startDate, endDate)
      setTimeSlotCancelData(timeSlotData)

      const staffData = await getStaffCancelAnalysis(clinicId, startDate, endDate)
      setStaffCancelData(staffData)

      const treatmentData = await getTreatmentCancelAnalysis(clinicId, startDate, endDate)
      setTreatmentCancelData(treatmentData)

    } catch (error) {
      console.error('分析データ取得エラー:', error)
      // エラーが発生した場合はデフォルト値を設定
      setAnalyticsData(null)
      setCancelAnalysisData(null)
      setTimeSlotCancelData([])
      setStaffCancelData([])
      setTreatmentCancelData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate && clinicId) {
      loadAnalyticsData()
    }
  }, [startDate, endDate, comparisonType, clinicId])

  // メニュードリルダウン処理
  const handleMenuClick = async (menuId: string, menuName: string, level: number) => {
    // 次のレベルを計算
    const nextLevel = (level + 1) as 1 | 2 | 3

    if (nextLevel > 3) return // level 3が最深層

    try {
      // 子メニューを取得
      const childMenus = await getTreatmentMenuStatsByParent(
        clinicId,
        startDate,
        endDate,
        menuId,
        nextLevel
      )

      // パンくずリストに追加
      setMenuBreadcrumb([...menuBreadcrumb, { id: menuId, name: menuName, level }])
      setDrilldownMenus(childMenus)
      setCurrentLevel(nextLevel)
      setSelectedMenuId(menuId)
    } catch (error) {
      console.error('子メニュー取得エラー:', error)
    }
  }

  // パンくずリストから戻る処理
  const handleBreadcrumbClick = async (index: number) => {
    if (index === -1) {
      // トップレベルに戻る
      setMenuBreadcrumb([])
      setDrilldownMenus([])
      setCurrentLevel(1)
      setSelectedMenuId(null)
    } else {
      // 指定されたレベルに戻る
      const targetBreadcrumb = menuBreadcrumb[index]
      const newBreadcrumb = menuBreadcrumb.slice(0, index + 1)

      const nextLevel = (targetBreadcrumb.level + 1) as 1 | 2 | 3

      try {
        const childMenus = await getTreatmentMenuStatsByParent(
          clinicId,
          startDate,
          endDate,
          targetBreadcrumb.id,
          nextLevel
        )

        setMenuBreadcrumb(newBreadcrumb)
        setDrilldownMenus(childMenus)
        setCurrentLevel(nextLevel)
        setSelectedMenuId(targetBreadcrumb.id)
      } catch (error) {
        console.error('メニュー取得エラー:', error)
      }
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">分析</h1>
        </div>
        <BarChart3 className="w-8 h-8 text-blue-600" />
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', label: '基本分析', icon: BarChart3 },
            { id: 'sales', label: '売上分析', icon: DollarSign },
            { id: 'staff', label: 'スタッフ分析', icon: Users },
            { id: 'visits', label: '来院経路分析', icon: Calendar },
            { id: 'cancellation', label: 'キャンセル分析', icon: Activity },
            { id: 'training', label: 'トレーニング', icon: Target }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 font-medium text-base flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* 期間選択とフィルター */}
      <Card>
        <CardHeader>
          <CardTitle>分析設定</CardTitle>
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
            <div>
              <Label htmlFor="comparison">比較</Label>
              <select
                id="comparison"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={comparisonType}
                onChange={(e) => setComparisonType(e.target.value as 'previous' | 'same_period_last_year' | 'none')}
              >
                <option value="previous">前期間</option>
                <option value="same_period_last_year">前年同期</option>
                <option value="none">比較なし</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* タブコンテンツ */}
      {analyticsData && (
        <>
          {activeTab === 'basic' && (
            <>
              {/* KPIカード */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">総予約数</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.kpi.total_appointments}</div>
                    {comparisonType !== 'none' && analyticsData.comparison_data && (
                      <p className={`text-xs flex items-center ${analyticsData.comparison_data.changes.appointments_change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${analyticsData.comparison_data.changes.appointments_change_percentage < 0 ? 'rotate-180' : ''}`} />
                        {analyticsData.comparison_data.changes.appointments_change_percentage >= 0 ? '+' : ''}
                        {analyticsData.comparison_data.changes.appointments_change_percentage.toFixed(1)}% {analyticsData.comparison_data.comparison_label}
                      </p>
                    )}
                    <p className="text-xs text-red-600 mt-1">
                      キャンセル率: {analyticsData.kpi.cancellation_rate.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">総患者数</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.kpi.total_patients}</div>
                    {comparisonType !== 'none' && analyticsData.comparison_data && (
                      <p className={`text-xs flex items-center ${analyticsData.comparison_data.changes.patients_change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${analyticsData.comparison_data.changes.patients_change_percentage < 0 ? 'rotate-180' : ''}`} />
                        {analyticsData.comparison_data.changes.patients_change_percentage >= 0 ? '+' : ''}
                        {analyticsData.comparison_data.changes.patients_change_percentage.toFixed(1)}% {analyticsData.comparison_data.comparison_label}
                      </p>
                    )}
                    <p className="text-xs text-green-600 mt-1">
                      継続率: {analyticsData.kpi.retention_rate.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">新規患者数</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.kpi.new_patients}</div>
                    {comparisonType !== 'none' && analyticsData.comparison_data && (
                      <p className={`text-xs flex items-center ${analyticsData.comparison_data.changes.new_patients_change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${analyticsData.comparison_data.changes.new_patients_change_percentage < 0 ? 'rotate-180' : ''}`} />
                        {analyticsData.comparison_data.changes.new_patients_change_percentage >= 0 ? '+' : ''}
                        {analyticsData.comparison_data.changes.new_patients_change_percentage.toFixed(1)}% {analyticsData.comparison_data.comparison_label}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      全体の{analyticsData.kpi.total_patients > 0 ? ((analyticsData.kpi.new_patients / analyticsData.kpi.total_patients) * 100).toFixed(0) : 0}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">総売上</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">¥{analyticsData.kpi.total_sales.toLocaleString()}</div>
                    {comparisonType !== 'none' && analyticsData.comparison_data && (
                      <p className={`text-xs flex items-center ${analyticsData.comparison_data.changes.sales_change_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${analyticsData.comparison_data.changes.sales_change_percentage < 0 ? 'rotate-180' : ''}`} />
                        {analyticsData.comparison_data.changes.sales_change_percentage >= 0 ? '+' : ''}
                        {analyticsData.comparison_data.changes.sales_change_percentage.toFixed(1)}% {analyticsData.comparison_data.comparison_label}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">
                      患者平均: ¥{analyticsData.kpi.average_sales_per_patient.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 売上内訳 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>売上内訳</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="text-sm font-medium">保険診療</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">¥{analyticsData.kpi.insurance_sales.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            {((analyticsData.kpi.insurance_sales / analyticsData.kpi.total_sales) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="text-sm font-medium">自費診療</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">¥{analyticsData.kpi.self_pay_sales.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            {((analyticsData.kpi.self_pay_sales / analyticsData.kpi.total_sales) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>売上詳細</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">保険診療</span>
                          <span className="text-sm text-gray-500">67%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">医療保険適用</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">自費診療</span>
                          <span className="text-sm text-gray-500">33%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '33%' }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">自由診療・美容</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 期間別売上推移 */}
              {analyticsData.aggregated_sales_trend && analyticsData.aggregated_sales_trend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>売上推移（日別）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium text-gray-600">期間</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-600">予約数</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-600">総売上</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-600">保険診療</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-600">自費診療</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.aggregated_sales_trend.map((item, index) => (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="py-2 px-3 font-medium">{item.label}</td>
                              <td className="text-right py-2 px-3">{item.appointment_count}件</td>
                              <td className="text-right py-2 px-3 font-semibold">¥{item.total_sales.toLocaleString()}</td>
                              <td className="text-right py-2 px-3 text-blue-600">¥{item.insurance_sales.toLocaleString()}</td>
                              <td className="text-right py-2 px-3 text-green-600">¥{item.self_pay_sales.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 font-semibold">
                            <td className="py-2 px-3">合計</td>
                            <td className="text-right py-2 px-3">
                              {analyticsData.aggregated_sales_trend.reduce((sum, item) => sum + item.appointment_count, 0)}件
                            </td>
                            <td className="text-right py-2 px-3">
                              ¥{analyticsData.aggregated_sales_trend.reduce((sum, item) => sum + item.total_sales, 0).toLocaleString()}
                            </td>
                            <td className="text-right py-2 px-3 text-blue-600">
                              ¥{analyticsData.aggregated_sales_trend.reduce((sum, item) => sum + item.insurance_sales, 0).toLocaleString()}
                            </td>
                            <td className="text-right py-2 px-3 text-green-600">
                              ¥{analyticsData.aggregated_sales_trend.reduce((sum, item) => sum + item.self_pay_sales, 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 診療メニュー別の予約数 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>診療メニュー別の予約数</span>
                    {menuBreadcrumb.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <button
                          onClick={() => handleBreadcrumbClick(-1)}
                          className="text-blue-600 hover:underline"
                        >
                          メニュー-1
                        </button>
                        {menuBreadcrumb.map((crumb, index) => (
                          <span key={crumb.id} className="flex items-center gap-2">
                            <span className="text-gray-400">/</span>
                            <button
                              onClick={() => handleBreadcrumbClick(index)}
                              className="text-blue-600 hover:underline"
                            >
                              {crumb.name}
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(currentLevel === 1 ? analyticsData.treatment_menu_stats : drilldownMenus) &&
                     (currentLevel === 1 ? analyticsData.treatment_menu_stats : drilldownMenus).length > 0 ? (
                      (currentLevel === 1 ? analyticsData.treatment_menu_stats : drilldownMenus)
                        .map((menu, index) => {
                          const menuList = currentLevel === 1 ? analyticsData.treatment_menu_stats : drilldownMenus
                          const total = menuList.reduce((sum, m) => sum + m.appointment_count, 0)
                          const percentage = total > 0 ? (menu.appointment_count / total) * 100 : 0
                          const hasChildren = menu.level < 3

                          return (
                            <div
                              key={menu.menu_id}
                              className={`border-b pb-3 last:border-b-0 ${hasChildren ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                              onClick={() => hasChildren && handleMenuClick(menu.menu_id, menu.treatment_name, menu.level)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                                  <span className="font-medium text-gray-900">{menu.treatment_name}</span>
                                  {hasChildren && (
                                    <span className="text-xs text-gray-400">(クリックで詳細表示)</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                                  <span className="font-bold text-blue-600">{menu.appointment_count}件</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })
                    ) : (
                      <p className="text-gray-500 text-center py-4">診療メニューデータがありません</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'staff' && analyticsData && (
            <StaffAnalyticsTab staffData={analyticsData.staff_productivity} />
          )}

          {activeTab === 'cancellation' && (
            <>
              {/* キャンセル基本統計 */}
              {cancelAnalysisData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">総キャンセル数</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{cancelAnalysisData.total_cancelled}</div>
                        <p className="text-xs text-muted-foreground">
                          本登録: {cancelAnalysisData.registered_cancelled} / 仮登録: {cancelAnalysisData.temporary_cancelled}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">キャンセル率</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analyticsData ? ((cancelAnalysisData.total_cancelled / analyticsData.kpi.total_appointments) * 100).toFixed(1) : '0.0'}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          全予約に対する比率
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">主要キャンセル理由</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {cancelAnalysisData.reasons.length > 0 ? cancelAnalysisData.reasons[0].reason_name : 'なし'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cancelAnalysisData.reasons.length > 0 ? `${cancelAnalysisData.reasons[0].count}件` : ''}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* キャンセル理由別分析 */}
                  {cancelAnalysisData && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>キャンセル理由別分析</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {cancelAnalysisData.reasons.map((reason) => (
                            <div key={reason.reason_id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-medium">{reason.reason_name}</h3>
                                  <p className="text-sm text-gray-500">総キャンセル数: {reason.count}件</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold">
                                    {cancelAnalysisData.total_cancelled > 0 
                                      ? ((reason.count / cancelAnalysisData.total_cancelled) * 100).toFixed(1) 
                                      : '0.0'}%
                                  </div>
                                  <div className="text-sm text-gray-500">全体に占める割合</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500">本登録患者</div>
                                  <div className="font-semibold">{reason.registered_count}件</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">仮登録患者</div>
                                  <div className="font-semibold">{reason.temporary_count}件</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 時間帯別キャンセル分析 */}
                  {timeSlotCancelData.length > 0 && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>時間帯別キャンセル分析</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {timeSlotCancelData.map((slot) => (
                            <div key={slot.time_slot} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium">{slot.time_slot}</h3>
                                  <p className="text-sm text-gray-500">キャンセル数: {slot.cancel_count}件</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-red-600">
                                    {slot.cancel_rate.toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-gray-500">キャンセル率</div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
      )}

                  {/* スタッフ別キャンセル分析 */}
                  {staffCancelData.length > 0 && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>スタッフ別キャンセル分析</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {staffCancelData.map((staff) => (
                            <div key={staff.staff_id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-medium">{staff.staff_name}</h3>
                                  <p className="text-sm text-gray-500">{staff.position_name}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-red-600">
                                    {staff.cancel_rate.toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-gray-500">キャンセル率</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500">総予約数</div>
                                  <div className="font-semibold">{staff.total_appointments}件</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">キャンセル数</div>
                                  <div className="font-semibold">{staff.cancelled_appointments}件</div>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>
                  )}

                  {/* 診療メニュー別キャンセル分析 */}
                  {treatmentCancelData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>診療メニュー別キャンセル分析</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {treatmentCancelData.map((treatment) => (
                            <div key={treatment.menu_id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-medium">{treatment.menu_name}</h3>
                                  <p className="text-sm text-gray-500">総予約数: {treatment.total_appointments}件</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-red-600">
                                    {treatment.cancel_rate.toFixed(1)}%
                                  </div>
                                  <div className="text-sm text-gray-500">キャンセル率</div>
                                </div>
                              </div>
                              <div className="text-sm">
                                <div className="text-gray-500">キャンセル数</div>
                                <div className="font-semibold">{treatment.cancelled_appointments}件</div>
                              </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>キャンセル分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">データを読み込み中</h3>
                      <p className="text-gray-500">
                        キャンセル分析データを取得しています...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}


          {activeTab === 'visits' && (
            <IntegratedVisitAnalysisTab
              clinicId={clinicId}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </>
      )}

      {/* 売上分析タブ */}
      {activeTab === 'sales' && clinicId && (
        <SalesAnalyticsTab
          clinicId={clinicId}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* トレーニング分析タブ */}
      {activeTab === 'training' && (
        <TrainingAnalyticsTab />
      )}

      {/* データなしの場合 */}
      {!analyticsData && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">データを読み込み中</h3>
            <p className="text-gray-500">
              分析データを取得しています...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}