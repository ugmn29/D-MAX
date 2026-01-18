'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronRight, PieChart } from 'lucide-react'
import {
  StaffProductivityData,
  aggregateTimeSlotStats,
  aggregateDayOfWeekStats,
  getDayOfWeekName
} from '@/lib/api/analytics'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

interface StaffAnalyticsTabProps {
  staffData: StaffProductivityData[]
}

// 役職ごとの色
const POSITION_COLORS: Record<string, string> = {
  '院長': '#8B5CF6',
  '歯科医師': '#3B82F6',
  '歯科衛生士': '#10B981',
  '歯科助手': '#F59E0B',
  '受付': '#EC4899',
  '不明': '#6B7280'
}

export default function StaffAnalyticsTab({ staffData }: StaffAnalyticsTabProps) {
  // 役職でフィルタリング
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set())
  const [expandedStaff, setExpandedStaff] = useState<Set<string>>(new Set())

  // 利用可能な役職一覧
  const availablePositions = useMemo(() => {
    const positions = new Set(staffData.map(s => s.position_name))
    return Array.from(positions)
  }, [staffData])

  // 初期状態では全役職を選択
  useMemo(() => {
    if (selectedPositions.size === 0 && availablePositions.length > 0) {
      setSelectedPositions(new Set(availablePositions))
    }
  }, [availablePositions])

  // フィルタリングされたスタッフデータ
  const filteredStaffData = useMemo(() => {
    if (selectedPositions.size === 0) return staffData
    return staffData.filter(s => selectedPositions.has(s.position_name))
  }, [staffData, selectedPositions])

  // 役職選択トグル
  const togglePosition = (position: string) => {
    const newSelected = new Set(selectedPositions)
    if (newSelected.has(position)) {
      newSelected.delete(position)
    } else {
      newSelected.add(position)
    }
    setSelectedPositions(newSelected)
  }

  // 治療内容の展開トグル
  const toggleTreatmentExpansion = (staffId: string) => {
    const newExpanded = new Set(expandedStaff)
    if (newExpanded.has(staffId)) {
      newExpanded.delete(staffId)
    } else {
      newExpanded.add(staffId)
    }
    setExpandedStaff(newExpanded)
  }

  // 時間帯別統計（全体）
  const timeSlotData = useMemo(() => {
    return aggregateTimeSlotStats(filteredStaffData).map(stat => ({
      time: `${stat.hour}:00`,
      予約数: stat.appointment_count
    }))
  }, [filteredStaffData])

  // 曜日別統計（全体）
  const dayOfWeekData = useMemo(() => {
    return aggregateDayOfWeekStats(filteredStaffData).map(stat => ({
      曜日: getDayOfWeekName(stat.day_of_week),
      予約数: stat.appointment_count
    }))
  }, [filteredStaffData])

  // スタッフ比較データ（売上推移）
  const staffComparisonData = useMemo(() => {
    if (filteredStaffData.length === 0) return []

    // すべての日付を収集
    const allDates = new Set<string>()
    filteredStaffData.forEach(staff => {
      staff.daily_trends.forEach(trend => allDates.add(trend.date))
    })

    const sortedDates = Array.from(allDates).sort()

    return sortedDates.map(date => {
      const dataPoint: any = { date }
      filteredStaffData.forEach(staff => {
        const trend = staff.daily_trends.find(t => t.date === date)
        dataPoint[staff.staff_name] = trend ? trend.sales : 0
      })
      return dataPoint
    })
  }, [filteredStaffData])

  return (
    <div className="space-y-6">
      {/* 役職フィルター */}
      <Card>
        <CardHeader>
          <CardTitle>役職フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {availablePositions.map(position => (
              <div key={position} className="flex items-center space-x-2">
                <Checkbox
                  id={`position-${position}`}
                  checked={selectedPositions.has(position)}
                  onCheckedChange={() => togglePosition(position)}
                />
                <Label htmlFor={`position-${position}`} className="cursor-pointer">
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: POSITION_COLORS[position] || POSITION_COLORS['不明'] }}
                  />
                  {position}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* スタッフカード一覧 */}
      <div className="grid grid-cols-1 gap-6">
        {filteredStaffData.map(staff => (
          <Card key={staff.staff_id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: POSITION_COLORS[staff.position_name] || POSITION_COLORS['不明'] }}
                    />
                    {staff.staff_name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{staff.position_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">¥{staff.total_sales.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">総売上</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 基本指標 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">予約数</div>
                  <div className="text-xl font-semibold">{staff.appointment_count}件</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">平均売上/件</div>
                  <div className="text-xl font-semibold">¥{Math.round(staff.average_sales_per_appointment).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">時間あたり売上</div>
                  <div className="text-xl font-semibold">¥{Math.round(staff.sales_per_hour).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">埋め率</div>
                  <div className="text-xl font-semibold text-blue-600">{staff.fill_rate.toFixed(1)}%</div>
                </div>
              </div>

              {/* 埋め率パイチャート */}
              <div className="flex items-center gap-4">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: '予約済み', value: staff.booked_slots },
                          { name: '空き', value: staff.available_slots - staff.booked_slots }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        <Cell fill="#3B82F6" />
                        <Cell fill="#E5E7EB" />
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">予約済み枠数</div>
                  <div className="text-lg font-semibold">{staff.booked_slots} / {staff.available_slots}枠</div>
                </div>
              </div>

              {/* 治療内容別集計 */}
              {staff.treatment_breakdown.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">治療内容別</div>
                    {staff.treatment_breakdown.length > 5 && (
                      <button
                        onClick={() => toggleTreatmentExpansion(staff.staff_id)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {expandedStaff.has(staff.staff_id) ? (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            閉じる
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            もっと見る
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {(expandedStaff.has(staff.staff_id)
                      ? staff.treatment_breakdown
                      : staff.treatment_breakdown.slice(0, 5)
                    ).map(treatment => (
                      <div key={treatment.menu_id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{treatment.menu_name}</span>
                        <span className="font-semibold">{treatment.count}件</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 日別売上推移グラフ */}
              {staff.daily_trends.length > 0 && (
                <div>
                  <div className="font-semibold mb-2">日別売上推移</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={staff.daily_trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value)
                          return `${date.getMonth() + 1}/${date.getDate()}`
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: any) => `¥${value.toLocaleString()}`}
                        labelFormatter={(label) => {
                          const date = new Date(label)
                          return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
                        }}
                      />
                      <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 時間帯別分析 */}
      {timeSlotData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>時間帯別予約数</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSlotData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="予約数" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 曜日別分析 */}
      {dayOfWeekData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>曜日別予約数</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="曜日" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="予約数" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* スタッフ比較グラフ */}
      {staffComparisonData.length > 0 && filteredStaffData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>スタッフ別売上比較</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={staffComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => `¥${value.toLocaleString()}`}
                  labelFormatter={(label) => {
                    const date = new Date(label)
                    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <Legend />
                {filteredStaffData.map(staff => (
                  <Line
                    key={staff.staff_id}
                    type="monotone"
                    dataKey={staff.staff_name}
                    stroke={POSITION_COLORS[staff.position_name] || POSITION_COLORS['不明']}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* データなしメッセージ */}
      {filteredStaffData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            選択された役職のスタッフがいません
          </CardContent>
        </Card>
      )}
    </div>
  )
}
