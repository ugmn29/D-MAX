'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Activity } from 'lucide-react'
import { getAnalyticsData, AnalyticsData, getCancelAnalysisData, getTimeSlotCancelAnalysis, getStaffCancelAnalysis, getTreatmentCancelAnalysis, CancelAnalysisData, TimeSlotCancelData, StaffCancelData, TreatmentCancelData } from '@/lib/api/analytics'

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [cancelAnalysisData, setCancelAnalysisData] = useState<CancelAnalysisData | null>(null)
  const [timeSlotCancelData, setTimeSlotCancelData] = useState<TimeSlotCancelData[]>([])
  const [staffCancelData, setStaffCancelData] = useState<StaffCancelData[]>([])
  const [treatmentCancelData, setTreatmentCancelData] = useState<TreatmentCancelData[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('basic')

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
      const clinicId = '11111111-1111-1111-1111-111111111111'
      
      // 基本分析データを取得
      const data = await getAnalyticsData(clinicId, startDate, endDate)
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      loadAnalyticsData()
    }
  }, [startDate, endDate])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">分析</h1>
          <p className="text-gray-600 mt-1">医院の運営状況を可視化し、データに基づいた経営判断をサポートします</p>
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
            { id: 'visits', label: '来院分析', icon: Calendar },
            { id: 'cancellation', label: 'キャンセル分析', icon: Activity },
            { id: 'marketing', label: 'Web予約効果', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Label htmlFor="period">期間</Label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="monthly">月別</option>
                <option value="weekly">週別</option>
                <option value="daily">日別</option>
              </select>
            </div>
            <div>
              <Label htmlFor="comparison">比較</Label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {analyticsData.kpi.appointments_change_percentage.toFixed(1)}% 前期比
                    </p>
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
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {analyticsData.kpi.patients_change_percentage.toFixed(1)}% 前期比
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      全体の{((analyticsData.kpi.new_patients / analyticsData.kpi.total_patients) * 100).toFixed(0)}%
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
                    <p className="text-xs text-muted-foreground flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {analyticsData.kpi.sales_change_percentage.toFixed(1)}% 前期比
                    </p>
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
            </>
          )}

          {activeTab === 'staff' && (
            <>
              {/* スタッフ生産性 */}
              <Card>
                <CardHeader>
                  <CardTitle>スタッフ別生産性</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.staff_productivity.map((staff) => (
                      <div key={staff.staff_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{staff.staff_name}</h3>
                            <p className="text-sm text-gray-500">{staff.position_name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">¥{staff.total_sales.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">総売上</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">予約数</div>
                            <div className="font-semibold">{staff.appointment_count}件</div>
                          </div>
                          <div>
                            <div className="text-gray-500">時間あたり売上</div>
                            <div className="font-semibold">¥{staff.sales_per_hour.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">平均売上</div>
                            <div className="font-semibold">¥{staff.average_sales_per_appointment.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">評価スコア</div>
                            <div className="font-semibold text-blue-600">
                              {Math.round((staff.sales_per_hour / 15000) * 100)}点
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
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

          {activeTab === 'marketing' && (
            <Card>
              <CardHeader>
                <CardTitle>Web予約効果分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Web予約効果分析機能</h3>
                  <p className="text-gray-500">
                    マーケティングROI分析機能は開発中です。
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'sales' && (
            <Card>
              <CardHeader>
                <CardTitle>売上分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">売上分析機能</h3>
                  <p className="text-gray-500">
                    詳細な売上分析機能は開発中です。
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'visits' && (
            <Card>
              <CardHeader>
                <CardTitle>来院分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">来院分析機能</h3>
                  <p className="text-gray-500">
                    来院パターン分析機能は開発中です。
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
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