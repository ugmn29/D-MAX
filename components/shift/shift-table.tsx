'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Printer, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { ShiftPattern, StaffShift } from '@/types/database'
import { getShiftPatterns } from '@/lib/api/shift-patterns'
import { getStaffShifts, upsertStaffShift } from '@/lib/api/shifts'
import { getStaff, saveStaffWeeklySchedule, getStaffWeeklySchedule, WeeklySchedule, getStaffPositions } from '@/lib/api/staff'
import { getHolidays, setClinicSetting } from '@/lib/api/clinic'
import { getIndividualHolidays, setIndividualHoliday } from '@/lib/api/individual-holidays'
import { formatDateForDB } from '@/lib/utils/date'
import { ShiftModal } from './shift-modal'
import { StaffScheduleModal } from './staff-schedule-modal'
import { DateHolidayModal } from './date-holiday-modal'
import { BulkHolidayModal } from './bulk-holiday-modal'
import { WorkingDayModal } from './working-day-modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AlertDialog } from '@/components/ui/alert-dialog'

interface ShiftTableProps {
  clinicId: string
  refreshTrigger?: number // 外部からのリフレッシュトリガー
}

interface StaffWithPosition {
  id: string
  name: string
  position: {
    id: string
    name: string
    sort_order: number
  }
}

export function ShiftTable({ clinicId, refreshTrigger }: ShiftTableProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [staff, setStaff] = useState<StaffWithPosition[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [patterns, setPatterns] = useState<ShiftPattern[]>([])
  const [shifts, setShifts] = useState<StaffShift[]>([])
  const [holidays, setHolidays] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ staffId: string; date: string; dateString: string } | null>(null)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [selectedStaffName, setSelectedStaffName] = useState('')
  const [showStaffScheduleModal, setShowStaffScheduleModal] = useState(false)
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] = useState<{ id: string; name: string; weeklySchedule?: any } | null>(null)
  const [showDateHolidayModal, setShowDateHolidayModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [individualHolidays, setIndividualHolidays] = useState<Record<string, boolean>>({})
  const [showBulkHolidayModal, setShowBulkHolidayModal] = useState(false)
  const [showWorkingDayModal, setShowWorkingDayModal] = useState(false)
  const [selectedWorkingDate, setSelectedWorkingDate] = useState('')

  // 確認ダイアログとアラート用のstate
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  // 現在の月の日付配列を生成
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dayDate = new Date(year, month, i)
      days.push({
        date: i,
        dayOfWeek: dayDate.getDay(),
        isSunday: dayDate.getDay() === 0,
        isSaturday: dayDate.getDay() === 6,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      })
    }

    return days
  }

  // データの読み込み
  const loadData = async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      console.log('シフト表データ読み込み開始:', { clinicId, year, month })

      const [staffData, positionsData, patternsData, shiftsData, holidaysData, individualHolidaysData] = await Promise.all([
        getStaff(clinicId),
        getStaffPositions(clinicId),
        getShiftPatterns(clinicId),
        getStaffShifts(clinicId, year, month),
        getHolidays(clinicId),
        getIndividualHolidays(clinicId, year, month)
      ])

      console.log('読み込んだデータ:', {
        staff: staffData.length,
        positions: positionsData.length,
        patterns: patternsData.length,
        shifts: shiftsData.length,
        holidays: holidaysData.length
      })
      
      // スタッフデータの詳細をログ出力
      console.log('スタッフデータ詳細:', staffData)
      console.log('役職データ詳細:', positionsData)
      
      // シフトデータの詳細をログ出力
      console.log('シフトデータ詳細:', JSON.stringify(shiftsData.slice(0, 5), null, 2))

      // スタッフデータを役職情報と結合
      console.log('フィルタリング前のスタッフデータ:', staffData)
      console.log('is_activeフィルタリング後のスタッフデータ:', staffData.filter(s => s.is_active))
      
      const staffWithPositions = staffData
        .filter(s => s.is_active)
        .map(s => {
          const position = positionsData.find(p => p.id === s.position_id)
          return {
            id: s.id,
            name: s.name,
            position: position || { id: '', name: '未設定', sort_order: 999 }
          }
        })
        .sort((a, b) => a.position.sort_order - b.position.sort_order)

      console.log('処理後のスタッフデータ:', staffWithPositions)
      console.log('スタッフデータ詳細:', staffWithPositions.map(s => ({ 
        id: s.id, 
        name: s.name, 
        position: s.position.name,
        positionId: s.position.id 
      })))

      setStaff(staffWithPositions)
      setPositions(positionsData)
      setPatterns(patternsData)
      setShifts(shiftsData)
      setHolidays(holidaysData)
      setIndividualHolidays(individualHolidaysData)
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('シフト表 useEffect トリガー:', { clinicId, currentDate: currentDate.toISOString(), refreshTrigger })
    loadData()
  }, [clinicId, currentDate, refreshTrigger])

  // クリニック設定と個別休診日の変更を監視
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clinic_settings_updated' && e.newValue) {
        try {
          const updateData = JSON.parse(e.newValue)
          console.log('シフト表: クリニック設定変更を検知:', updateData)
          // 休診日設定が変更された場合はデータを再読み込み
          if (updateData.holidays) {
            console.log('シフト表: 休診日設定変更によりデータを再読み込み')
            loadData()
          }
        } catch (error) {
          console.error('シフト表: 設定更新データの解析エラー:', error)
        }
      } else if (e.key === 'mock_individual_holidays') {
        console.log('シフト表: 個別休診日設定変更を検知')
        // 個別休診日設定が変更された場合はデータを再読み込み
        loadData()
      }
    }

    const handleIndividualHolidaysUpdate = (e: CustomEvent) => {
      console.log('シフト表: 個別休診日更新イベントを受信:', e.detail)
      // 個別休診日設定が変更された場合はデータを再読み込み
      console.log('シフト表: loadData()を実行します')
      loadData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('individualHolidaysUpdated', handleIndividualHolidaysUpdate as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('individualHolidaysUpdated', handleIndividualHolidaysUpdate as EventListener)
    }
  }, [])

  // 月の移動
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  // 特定のスタッフの特定の日のシフトを取得
  const getStaffShift = (staffId: string, dateString: string) => {
    return shifts.find(s => s.staff_id === staffId && s.date === dateString)
  }

  // 日付ヘッダーのクリック（休診日/診療日設定モーダルを開く）
  const handleDateHeaderClick = (dateString: string) => {
    console.log('日付ヘッダークリック:', dateString)
    const clickedDate = new Date(dateString)
    const isCurrentlyHoliday = isHoliday(clickedDate)
    
    if (isCurrentlyHoliday) {
      // 休診日の場合は診療日設定モーダルを開く
      setSelectedWorkingDate(dateString)
      setShowWorkingDayModal(true)
    } else {
      // 診療日の場合は休診日設定モーダルを開く
      setSelectedDate(dateString)
      setShowDateHolidayModal(true)
    }
  }

  // セルのクリック（個別シフト設定）
  const handleCellClick = (staffId: string, dateString: string) => {
    const staffMember = staff.find(s => s.id === staffId)
    const existingShift = getStaffShift(staffId, dateString)
    setSelectedCell({ staffId, date: dateString, dateString })
    setSelectedStaffName(staffMember?.name || '')
    setShowShiftModal(true)
  }

  // シフト保存
  const handleShiftSave = async (shiftPatternId: string | null, isHoliday: boolean) => {
    if (!selectedCell) return

    try {
      setLoading(true)
      
      // シフトパターンから時間情報を取得
      const selectedPattern = patterns.find(p => p.id === shiftPatternId)
      const shiftData: any = {
        staff_id: selectedCell.staffId,
        date: selectedCell.dateString,
        shift_pattern_id: shiftPatternId,
        is_holiday: isHoliday,
        clinic_id: clinicId
      }
      
      // シフトパターンが選択されている場合は時間情報を追加
      if (selectedPattern) {
        shiftData.start_time = selectedPattern.start_time
        shiftData.end_time = selectedPattern.end_time
        shiftData.break_start = selectedPattern.break_start
        shiftData.break_end = selectedPattern.break_end
      }
      
      await upsertStaffShift(clinicId, shiftData)
      
      // データを再読み込み
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const shiftsData = await getStaffShifts(clinicId, year, month)
      setShifts(shiftsData)
      
      setSelectedCell(null)
    } catch (error) {
      console.error('シフト保存エラー:', error)
      alert('シフトの保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 個別休診日保存
  const handleDateHolidaySave = async (isHoliday: boolean) => {
    try {
      setLoading(true)
      await setIndividualHoliday(clinicId, selectedDate, isHoliday)
      
      // 個別休診日データを再読み込み
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const individualHolidaysData = await getIndividualHolidays(clinicId, year, month)
      setIndividualHolidays(individualHolidaysData)
      
      console.log('個別休診日を保存しました:', { date: selectedDate, isHoliday })
    } catch (error) {
      console.error('個別休診日保存エラー:', error)
      alert('休診日の設定に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 一括休診日設定保存
  const handleBulkHolidaySave = async () => {
    try {
      // 休診日データを再読み込み
      const holidaysData = await getHolidays(clinicId)
      setHolidays(holidaysData)
      console.log('一括休診日設定を保存しました')
    } catch (error) {
      console.error('一括休診日設定読み込みエラー:', error)
    }
  }

  // 診療日設定保存
  const handleWorkingDaySave = async () => {
    try {
      console.log('診療日設定保存開始:', selectedWorkingDate)
      // 個別休診日データを再読み込み
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      console.log('診療日設定: 個別休診日を再読み込み', { clinicId, year, month })
      const individualHolidaysData = await getIndividualHolidays(clinicId, year, month)
      console.log('診療日設定: 取得した個別休診日データ:', individualHolidaysData)
      setIndividualHolidays(individualHolidaysData)
      
      console.log('診療日設定を保存しました:', selectedWorkingDate)
    } catch (error) {
      console.error('診療日設定読み込みエラー:', error)
    }
  }

  // スタッフ名クリック（固定シフト設定）
  const handleStaffNameClick = (staffMember: StaffWithPosition) => {
    console.log('スタッフ名クリック:', staffMember.name, staffMember.id)
    setSelectedStaffForSchedule({ id: staffMember.id, name: staffMember.name })
    
    // 現在の月の該当スタッフのシフトデータから週間スケジュールを構築
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const lastDay = new Date(year, month + 1, 0).getDate()
    
    console.log('固定シフト設定開始:', {
      staffName: staffMember.name,
      staffId: staffMember.id
    })

    // localStorageから保存された固定シフトパターンを取得
    const savedSchedule = getStaffWeeklySchedule(clinicId, staffMember.id)

    const weeklySchedule: WeeklySchedule = savedSchedule || {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null
    }

    console.log('取得した固定シフトパターン:', JSON.stringify(weeklySchedule, null, 2))
    
    setSelectedStaffForSchedule({ id: staffMember.id, name: staffMember.name, weeklySchedule })
    setShowStaffScheduleModal(true)
  }

  // 固定シフト保存（localStorageに保存するだけ、月への反映は別ボタン）
  const handleWeeklyScheduleSave = async (weeklySchedule: WeeklySchedule) => {
    if (!selectedStaffForSchedule) return

    try {
      // localStorageに固定シフトパターンを保存
      saveStaffWeeklySchedule(clinicId, selectedStaffForSchedule.id, weeklySchedule)

      setShowStaffScheduleModal(false)
      setSelectedStaffForSchedule(null)

      setAlertDialog({
        isOpen: true,
        title: '保存完了',
        message: '固定シフトパターンを保存しました。'
      })
    } catch (error: any) {
      console.error('固定シフトパターン保存エラー:', error)
      setAlertDialog({
        isOpen: true,
        title: 'エラー',
        message: `固定シフトパターンの保存に失敗しました: ${error.message}`
      })
    }
  }

  // 固定シフトを現在の月に反映（モーダル内から呼ばれる）
  const handleApplyWeeklyScheduleFromModal = async (weeklySchedule: WeeklySchedule) => {
    if (!selectedStaffForSchedule) return

    const staffId = selectedStaffForSchedule.id
    const staffName = selectedStaffForSchedule.name

    // 確認ダイアログを表示
    setConfirmDialog({
      isOpen: true,
      title: '固定シフトを反映',
      message: `${staffName}さんの固定シフトパターンを${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月に反映しますか？\n\n※ 今日以降の日付のシフトが上書きされます。`,
      onConfirm: async () => {
        try {
          setLoading(true)

          // まず保存
          saveStaffWeeklySchedule(clinicId, staffId, weeklySchedule)

          const year = currentDate.getFullYear()
          const month = currentDate.getMonth()
          const lastDay = new Date(year, month + 1, 0).getDate()
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          console.log('固定シフト反映開始:', {
            staffId,
            staffName,
            year,
            month: month + 1,
            weeklySchedule
          })

          const promises = []
          let appliedDaysCount = 0

          for (let day = 1; day <= lastDay; day++) {
            const date = new Date(year, month, day)
            const dayOfWeek = date.getDay()
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            const dayKey = dayNames[dayOfWeek]

            const patternId = weeklySchedule[dayKey as keyof WeeklySchedule]

            // 過去の日付はスキップ
            if (date < today) {
              continue
            }

            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

            const shiftData = {
              staff_id: staffId,
              date: dateString,
              shift_pattern_id: patternId,
              is_holiday: false,
              clinic_id: clinicId
            }

            promises.push(upsertStaffShift(clinicId, shiftData))
            appliedDaysCount++
          }

          await Promise.all(promises)

          // データを再読み込み
          const shiftsData = await getStaffShifts(clinicId, year, month + 1)
          setShifts(shiftsData)

          setShowStaffScheduleModal(false)
          setSelectedStaffForSchedule(null)

          setAlertDialog({
            isOpen: true,
            title: '反映完了',
            message: `固定シフトを保存し、この月に反映しました。\n（${appliedDaysCount}日分を更新）`
          })
        } catch (error: any) {
          console.error('固定シフト反映エラー:', error)
          setAlertDialog({
            isOpen: true,
            title: 'エラー',
            message: `固定シフトの反映に失敗しました: ${error.message}`
          })
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // 曜日の日本語名を取得
  const getDayName = (dayOfWeek: number) => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[dayOfWeek]
  }

  // 休診日かどうかを判定（医院設定の休診日 + 個別休診日）
  const isHoliday = (date: Date): boolean => {
    const dateString = formatDateForDB(date) // 日本時間で日付を処理
    
    // 個別休診日の設定がある場合はそれを優先
    if (individualHolidays.hasOwnProperty(dateString)) {
      console.log('休診日判定: 個別設定あり', { date: dateString, isHoliday: individualHolidays[dateString] })
      return individualHolidays[dateString]
    }
    
    // 個別設定がない場合は医院設定の休診日を適用
    const dayOfWeek = date.getDay() // 0=日曜日, 1=月曜日, ..., 6=土曜日
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const englishDayName = dayNames[dayOfWeek]
    
    const isClinicHoliday = holidays.includes(englishDayName)
    console.log('休診日判定: 医院設定適用', { date: dateString, dayOfWeek, englishDayName, holidays, isHoliday: isClinicHoliday })
    return isClinicHoliday
  }

  // セルの背景色を取得
  const getCellBackgroundColor = (shift: StaffShift | undefined, date: Date) => {
    if (isHoliday(date) && !shift?.shift_pattern_id) return 'bg-gray-200' // 休診日でシフト未設定はグレー
    if (shift?.is_holiday) return 'bg-gray-200' // 個別の休日はグレー
    if (shift?.shift_pattern_id === null) return 'bg-gray-100' // 勤務なしは薄いグレー
    if (shift?.shift_pattern_id) return 'bg-blue-50' // シフトがある場合は薄い青
    return 'bg-white'
  }

  const days = getDaysInMonth(currentDate)
  const monthName = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-medium min-w-[120px] text-center">
                {monthName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowBulkHolidayModal(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              休診日設定
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              印刷
            </Button>
          </div>
        </div>
        
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* シフト表レンダリング */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-50 px-2 py-2 text-xs font-medium text-gray-700 text-left min-w-[60px]">
                    役職
                  </th>
                  <th className="border border-gray-300 bg-gray-50 px-2 py-2 text-xs font-medium text-gray-700 text-left min-w-[90px]">
                    スタッフ
                  </th>
                  {days.map((day) => {
                    const dayDate = new Date(day.dateString)
                    const isHolidayDay = isHoliday(dayDate)
                    return (
                      <th
                        key={day.date}
                        className={`border border-gray-300 px-0.5 py-2 text-xs font-medium text-center cursor-pointer min-w-[28px] hover:bg-gray-200 ${
                          isHolidayDay ? 'bg-gray-200' : 'bg-gray-50'
                        }`}
                        onClick={() => handleDateHeaderClick(day.dateString)}
                      >
                        <div className={day.isSunday ? 'text-red-600' : day.isSaturday ? 'text-blue-600' : 'text-gray-900'}>{day.date}</div>
                        <div className={`text-xs ${day.isSunday ? 'text-red-500' : day.isSaturday ? 'text-blue-500' : 'text-gray-500'}`}>
                          {getDayName(day.dayOfWeek)}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 2} className="text-center py-8 text-gray-500">
                      スタッフが登録されていません。<br />
                      <span className="text-sm">「スタッフ」タブでスタッフを追加してください。</span>
                    </td>
                  </tr>
                ) : (
                  staff.map((staffMember, index) => {
                  const previousStaff = index > 0 ? staff[index - 1] : null
                  const nextStaff = index < staff.length - 1 ? staff[index + 1] : null
                  const showPosition = !previousStaff || previousStaff.position.id !== staffMember.position.id
                  
                  // 同じ役職のスタッフ数を計算
                  const samePositionStaff = staff.filter(s => s.position.id === staffMember.position.id)
                  const currentStaffIndex = samePositionStaff.findIndex(s => s.id === staffMember.id)
                  const rowspan = showPosition ? samePositionStaff.length : undefined
                  
                  return (
                    <tr key={staffMember.id}>
                      {showPosition && (
                        <td 
                          rowSpan={rowspan}
                          className="border border-gray-300 px-2 py-1 text-xs text-gray-700 bg-gray-50 min-w-[60px] align-top"
                        >
                          {staffMember.position.name}
                        </td>
                      )}
                      <td
                        className="border border-gray-300 px-2 py-1 text-xs text-gray-700 bg-gray-50 min-w-[90px] cursor-pointer hover:bg-gray-100"
                        onClick={() => handleStaffNameClick(staffMember)}
                      >
                        {staffMember.name}
                      </td>
                      {days.map((day) => {
                        const dayDate = new Date(day.dateString)
                        const isHolidayDay = isHoliday(dayDate)
                        const shift = getStaffShift(staffMember.id, day.dateString)
                        const pattern = patterns.find(p => p.id === shift?.shift_pattern_id)
                        
                        // 過去の日付かどうかをチェック
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const isPastDate = dayDate < today
                        
                        return (
                          <td
                            key={`${staffMember.id}-${day.date}`}
                            className={`border border-gray-300 px-0.5 py-1 text-xs text-center min-w-[28px] ${
                              isPastDate ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:bg-gray-100'
                            } ${getCellBackgroundColor(shift, dayDate)} ${
                              selectedCell?.staffId === staffMember.id && selectedCell?.date === day.dateString ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => !isPastDate && handleCellClick(staffMember.id, day.dateString)}
                          >
                            {isHolidayDay && !shift?.shift_pattern_id ? (
                              <span className="text-gray-500">休</span>
                            ) : shift?.is_holiday ? (
                              <span className="text-gray-500">休み</span>
                            ) : shift?.shift_pattern_id === null ? (
                              <span className="text-gray-400">-</span>
                            ) : pattern ? (
                              <span className="font-medium">{pattern.abbreviation}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* シフト設定モーダル */}
        <ShiftModal
          isOpen={showShiftModal}
          onClose={() => {
            setShowShiftModal(false)
            setSelectedCell(null)
          }}
          staffName={selectedStaffName}
          date={selectedCell?.dateString || ''}
          patterns={patterns}
          currentShift={selectedCell ? getStaffShift(selectedCell.staffId, selectedCell.dateString) : undefined}
          onSave={handleShiftSave}
        />

        {/* 固定シフト設定モーダル */}
        <StaffScheduleModal
          isOpen={showStaffScheduleModal}
          onClose={() => {
            setShowStaffScheduleModal(false)
            setSelectedStaffForSchedule(null)
          }}
          staffName={selectedStaffForSchedule?.name || ''}
          patterns={patterns}
          initialSchedule={selectedStaffForSchedule?.weeklySchedule}
          onSave={handleWeeklyScheduleSave}
          onApplyToMonth={handleApplyWeeklyScheduleFromModal}
        />

        {/* 個別休診日設定モーダル */}
        <DateHolidayModal
          isOpen={showDateHolidayModal}
          onClose={() => {
            setShowDateHolidayModal(false)
            setSelectedDate('')
          }}
          date={selectedDate}
          isCurrentlyHoliday={selectedDate ? isHoliday(new Date(selectedDate)) : false}
          onSave={handleDateHolidaySave}
        />

        {/* 一括休診日設定モーダル */}
        <BulkHolidayModal
          isOpen={showBulkHolidayModal}
          onClose={() => setShowBulkHolidayModal(false)}
          clinicId={clinicId}
          onSave={handleBulkHolidaySave}
        />

        {/* 診療日設定モーダル */}
        <WorkingDayModal
          isOpen={showWorkingDayModal}
          onClose={() => {
            setShowWorkingDayModal(false)
            setSelectedWorkingDate('')
          }}
          clinicId={clinicId}
          date={selectedWorkingDate}
          onSave={handleWorkingDaySave}
        />

        {/* 確認ダイアログ */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText="反映する"
          cancelText="キャンセル"
        />

        {/* アラートダイアログ */}
        <AlertDialog
          isOpen={alertDialog.isOpen}
          onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
          title={alertDialog.title}
          message={alertDialog.message}
        />
      </CardContent>
    </Card>
  )
}
