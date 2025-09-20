'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Plus, Trash2, Edit } from 'lucide-react'
import { getStaffShifts, upsertStaffShift, deleteStaffShift } from '@/lib/api/shifts'
import { getStaff } from '@/lib/api/staff'
import { getClinicSettings } from '@/lib/api/clinic'
import { getShiftPatterns } from '@/lib/api/shift-patterns'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]

const WORK_PATTERNS = [
  { id: 'fulltime', name: 'フルタイム', shortName: 'フル' },
  { id: 'morning', name: '午前', shortName: '午前' },
  { id: 'afternoon', name: '午後', shortName: '午後' },
  { id: 'custom', name: 'カスタム', shortName: 'カス' }
]

export default function ShiftSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [shifts, setShifts] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [shiftPatterns, setShiftPatterns] = useState<any[]>([])
  const [editingShift, setEditingShift] = useState<any>(null)
  const [showAddShift, setShowAddShift] = useState(false)
  const [units, setUnits] = useState<string[]>(['チェア1', 'チェア2', 'チェア3'])
  
  const [newShift, setNewShift] = useState({
    staff_id: '',
    date: '',
    shift_pattern_id: null as string | null,
    is_absent: false
  })

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth() + 1
        
        const [shiftsData, staffData, settings, patternsData] = await Promise.all([
          getStaffShifts(DEMO_CLINIC_ID, year, month),
          getStaff(DEMO_CLINIC_ID),
          getClinicSettings(DEMO_CLINIC_ID),
          getShiftPatterns(DEMO_CLINIC_ID)
        ])
        
        setShifts(shiftsData)
        setStaff(staffData)
        setShiftPatterns(patternsData)
        // カレンダー設定からユニット情報を取得
        setUnits(settings.units || ['チェア1', 'チェア2', 'チェア3'])
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [currentMonth])

  // 月間カレンダーの日付を生成
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  // シフト追加
  const handleAddShift = async () => {
    try {
      setSaving(true)
      await upsertStaffShift(DEMO_CLINIC_ID, { ...newShift, clinic_id: DEMO_CLINIC_ID })
      
      // データを再読み込み
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const data = await getStaffShifts(DEMO_CLINIC_ID, year, month)
      setShifts(data)
      
      setNewShift({
        staff_id: '',
        date: '',
        shift_pattern_id: null,
        is_absent: false
      })
      setShowAddShift(false)
    } catch (error) {
      console.error('シフト追加エラー:', error)
      alert('シフトの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 月移動
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setCurrentMonth(newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setCurrentMonth(newMonth)
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // 日付が現在の月かどうか
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  // 特定の日付のシフトを取得
  const getShiftsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return shifts.filter(shift => shift.date === dateString)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-screen">
        {/* 左サイドバー */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">シフト</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">シフト</div>
                <div className="text-sm text-blue-600">月間カレンダー形式のシフト管理</div>
              </div>
            </nav>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">シフト管理</h2>
                <p className="text-gray-600">月間カレンダー形式でシフトを管理します</p>
              </div>
              <Button onClick={() => setShowAddShift(true)}>
                <Plus className="w-4 h-4 mr-2" />
                シフト追加
              </Button>
            </div>

            {/* 月間カレンダー */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {currentMonth.getFullYear()}年 {MONTHS[currentMonth.getMonth()]}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                      前月
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      今月
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                      次月
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {/* 曜日ヘッダー */}
                  {WEEKDAYS.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* 日付とシフト */}
                  {generateCalendarDays().map((date, index) => {
                    const isCurrent = isCurrentMonth(date)
                    const dayShifts = getShiftsForDate(date)
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-20 p-2 border rounded ${
                          isCurrent ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayShifts.map(shift => (
                            <div
                              key={shift.id}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                            >
                              {shift.staff?.name || 'スタッフ不明'}
                              {shift.is_absent && ' (休)'}
                              {shift.shift_patterns && ` (${shift.shift_patterns.abbreviation})`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* シフト追加フォーム */}
            {showAddShift && (
              <Card>
                <CardHeader>
                  <CardTitle>新しいシフトを追加</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        スタッフ
                      </label>
                      <select
                        value={newShift.staff_id}
                        onChange={(e) => setNewShift(prev => ({ ...prev, staff_id: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">スタッフを選択</option>
                        {staff.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        日付
                      </label>
                      <input
                        type="date"
                        value={newShift.date}
                        onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        勤務パターン
                      </label>
                      <select
                        value={newShift.shift_pattern_id || ''}
                        onChange={(e) => setNewShift(prev => ({ 
                          ...prev, 
                          shift_pattern_id: e.target.value === '' ? null : e.target.value 
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">パターンを選択</option>
                        {shiftPatterns.map(pattern => (
                          <option key={pattern.id} value={pattern.id}>
                            {pattern.name} ({pattern.abbreviation})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_absent"
                        checked={newShift.is_absent}
                        onChange={(e) => setNewShift(prev => ({ ...prev, is_absent: e.target.checked }))}
                        className="rounded"
                      />
                      <label htmlFor="is_absent" className="text-sm font-medium text-gray-700">
                        休暇
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddShift(false)}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleAddShift}
                      disabled={saving || !newShift.staff_id || !newShift.date}
                    >
                      {saving ? '追加中...' : '追加'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
