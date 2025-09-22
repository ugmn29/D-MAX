'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, User, Heart, Zap, Smile } from 'lucide-react'
import { getAppointmentsByDate, createAppointment } from '@/lib/api/appointments'
import { getStaffShiftsByDate } from '@/lib/api/shifts'
import { getBusinessHours, getBreakTimes, getTimeSlotMinutes, getHolidays, getClinicSettings } from '@/lib/api/clinic'
import { Appointment, BusinessHours, BreakTimes, StaffShift } from '@/types/database'
import { AppointmentEditModal } from '@/components/forms/appointment-edit-modal'
import { formatDateForDB } from '@/lib/utils/date'
import { initializeMockData } from '@/lib/utils/mock-mode'

interface MainCalendarProps {
  clinicId: string
  selectedDate: Date
  onDateChange: (date: Date) => void
  timeSlotMinutes: number // 必須パラメータに変更
  displayItems?: string[] // 表示項目の設定
  cellHeight?: number // セルの高さ設定
}

interface TimeSlot {
  time: string
  hour: number
  minute: number
}

interface AppointmentBlock {
  appointment: Appointment
  top: number
  height: number
  staffIndex: number
}

interface WorkingStaff {
  staff: {
    id: string
    name: string
    position: string
  }
  shift_pattern: StaffShift['shift_patterns']
  is_holiday: boolean
}

export function MainCalendar({ clinicId, selectedDate, onDateChange, timeSlotMinutes, displayItems = [], cellHeight = 40 }: MainCalendarProps) {
  const [workingStaff, setWorkingStaff] = useState<WorkingStaff[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours>({})
  const [breakTimes, setBreakTimes] = useState<BreakTimes>({})

  // 複数選択関連の状態
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [selectionStart, setSelectionStart] = useState<string | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null)

  // デバッグログ
  console.log('MainCalendar: timeSlotMinutes:', timeSlotMinutes)
  console.log('MainCalendar: timeSlotMinutesの型:', typeof timeSlotMinutes)
  const [holidays, setHolidays] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState<string | null>(null)
  
  // 予約編集モーダル
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [selectedStaffIndex, setSelectedStaffIndex] = useState<number | undefined>(undefined)
  
  // スタッフデータのキャッシュ
  const [staffCache, setStaffCache] = useState<Map<string, WorkingStaff[]>>(new Map())
  
  // スクロール同期用のref
  const timeAxisRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // スクロール同期のイベントハンドラー
  const handleTimeAxisScroll = () => {
    if (timeAxisRef.current && gridRef.current) {
      gridRef.current.scrollTop = timeAxisRef.current.scrollTop
    }
  }

  const handleGridScroll = () => {
    if (timeAxisRef.current && gridRef.current) {
      timeAxisRef.current.scrollTop = gridRef.current.scrollTop
    }
  }

  // 出勤スタッフデータを取得する関数
  const loadWorkingStaff = async (date: Date) => {
    const dateString = formatDateForDB(date) // 日本時間で日付を処理
    
    // キャッシュをチェック
    if (staffCache.has(dateString)) {
      setWorkingStaff(staffCache.get(dateString)!)
      return
    }

    try {
      setStaffLoading(true)
      setStaffError(null)
      
      const shifts = await getStaffShiftsByDate(clinicId, dateString)
      
      // デバッグログを追加
      console.log('メインカレンダー: 取得したシフトデータ:', shifts)
      console.log('メインカレンダー: シフトデータの詳細:', shifts.map(shift => ({
        id: shift.id,
        staff_id: shift.staff_id,
        staff: shift.staff,
        shift_patterns: shift.shift_patterns,
        is_holiday: shift.is_holiday
      })))
      
      // 出勤しているスタッフのみフィルタリング（休暇でないスタッフ）
      const workingStaffData: WorkingStaff[] = shifts
        .filter(shift => !shift.is_holiday) // 休暇でないスタッフのみ
        .map(shift => ({
          staff: {
            id: shift.staff_id,
            name: shift.staff?.name || 'スタッフ名不明',
            position: shift.staff?.position?.name || 'その他'
          },
          shift_pattern: shift.shift_patterns,
          is_holiday: shift.is_holiday
        }))
        .sort((a, b) => {
          // 役職順でソート（歯科医師 → 歯科衛生士 → 歯科助手）
          const positionOrder = ['歯科医師', '歯科衛生士', '歯科助手']
          const aPosition = a.staff.position || 'その他'
          const bPosition = b.staff.position || 'その他'
          const aIndex = positionOrder.indexOf(aPosition)
          const bIndex = positionOrder.indexOf(bPosition)
          
          if (aIndex !== bIndex) {
            return aIndex - bIndex
          }
          
          // 同じ役職の場合は名前順
          return a.staff.name.localeCompare(b.staff.name, 'ja')
        })

      // キャッシュに保存
      setStaffCache(prev => new Map(prev.set(dateString, workingStaffData)))
      setWorkingStaff(workingStaffData)
      
    } catch (error) {
      console.error('スタッフデータ取得エラー:', error)
      setStaffError('スタッフデータの取得に失敗しました')
    } finally {
      setStaffLoading(false)
    }
  }

  // 時間スロットを生成
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = []
    
    console.log('MainCalendar: 時間スロット生成 - timeSlotMinutes:', timeSlotMinutes)
    console.log('MainCalendar: 時間スロット生成 - timeSlotMinutesの型:', typeof timeSlotMinutes)
    console.log('MainCalendar: 診療時間設定:', businessHours)

    // timeSlotMinutesが有効な数値でない場合はデフォルト値15を使用
    const validTimeSlotMinutes = (typeof timeSlotMinutes === 'number' && timeSlotMinutes > 0) ? timeSlotMinutes : 15
    console.log('MainCalendar: 使用する時間スロット値:', validTimeSlotMinutes)

    // 現在の曜日の診療時間を取得
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek] as keyof BusinessHours
    const dayHours = businessHours[dayId]
    
    // 診療時間が設定されている場合はその時間範囲を使用、そうでなければデフォルト値
    let startHour = 9
    let endHour = 18
    
    if (dayHours?.isOpen && dayHours?.timeSlots && dayHours.timeSlots.length > 0) {
      // 最初の時間枠の開始時間と最後の時間枠の終了時間を使用
      const firstSlot = dayHours.timeSlots[0]
      const lastSlot = dayHours.timeSlots[dayHours.timeSlots.length - 1]
      
      startHour = parseInt(firstSlot.start.split(':')[0])
      endHour = parseInt(lastSlot.end.split(':')[0])
      
      console.log('MainCalendar: 診療時間に基づく時間範囲:', { startHour, endHour })
    } else {
      console.log('MainCalendar: デフォルト時間範囲を使用:', { startHour, endHour })
    }

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += validTimeSlotMinutes) {
        if (hour === endHour && minute > 0) break
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          hour,
          minute
        })
      }
    }
    console.log('MainCalendar: 生成された時間スロット数:', slots.length)
    console.log('MainCalendar: 最初の5つのスロット:', slots.slice(0, 5))
    return slots
  }, [timeSlotMinutes, businessHours, selectedDate])

  // 時間文字列を分に変換する関数
  const timeToMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number)
    return hour * 60 + minute
  }

  // 分を時間文字列に変換する関数
  const minutesToTime = (minutes: number): string => {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  // 選択範囲内の時間スロットを計算する関数
  const getSelectedTimeSlots = (startTime: string, endTime: string): string[] => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const slots: string[] = []
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += timeSlotMinutes) {
      slots.push(minutesToTime(minutes))
    }
    
    return slots
  }

  // 長押し開始の処理
  const handleMouseDown = (timeSlot: string, e: React.MouseEvent) => {
    e.preventDefault()
    console.log('複数選択開始:', timeSlot)
    setIsSelecting(true)
    setSelectionStart(timeSlot)
    setSelectionEnd(timeSlot)
    setSelectedTimeSlots([timeSlot])
  }

  // マウス移動時の処理
  const handleMouseMove = (timeSlot: string) => {
    if (!isSelecting || !selectionStart) return
    
    console.log('複数選択拡張:', timeSlot, '開始:', selectionStart)
    setSelectionEnd(timeSlot)
    
    // 開始時間と終了時間を比較して範囲を決定
    const startMinutes = timeToMinutes(selectionStart)
    const endMinutes = timeToMinutes(timeSlot)
    
    if (startMinutes <= endMinutes) {
      setSelectedTimeSlots(getSelectedTimeSlots(selectionStart, timeSlot))
    } else {
      setSelectedTimeSlots(getSelectedTimeSlots(timeSlot, selectionStart))
    }
  }

  // 長押し終了の処理
  const handleMouseUp = () => {
    if (!isSelecting) return
    
    console.log('複数選択完了:', selectedTimeSlots)
    setIsSelecting(false)
    
    // 選択された時間範囲で予約編集モーダルを開く
    if (selectedTimeSlots.length > 0) {
      const startTime = selectedTimeSlots[0]
      // 選択されたスロット数に基づいて終了時間を計算
      const totalSlots = selectedTimeSlots.length
      const totalDuration = totalSlots * timeSlotMinutes
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = startMinutes + totalDuration
      const endTimeString = minutesToTime(endMinutes)
      
      console.log('複数選択完了:', { 
        startTime, 
        endTime: endTimeString, 
        totalSlots,
        totalDuration,
        timeSlotMinutes,
        selectedSlots: selectedTimeSlots 
      })
      setSelectedTimeSlot(startTime)
      setShowAppointmentModal(true)
    }
    
    // 選択状態をリセット（モーダルが閉じられた時にリセット）
    // setSelectedTimeSlots([])
    // setSelectionStart(null)
    // setSelectionEnd(null)
  }

  // データを読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // モックデータを初期化
        initializeMockData()
        
        const dateString = formatDateForDB(selectedDate) // 日本時間で日付を処理
        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof BusinessHours
        
        const [appointmentsData, businessHoursData, breakTimesData, holidaysData] = await Promise.all([
          getAppointmentsByDate(clinicId, dateString),
          getBusinessHours(clinicId),
          getBreakTimes(clinicId),
          getHolidays(clinicId)
        ])

        setAppointments(appointmentsData)
        setBusinessHours(businessHoursData)
        setBreakTimes(breakTimesData)
        setHolidays(holidaysData)
        
        console.log('カレンダー: 取得した予約データ:', appointmentsData)
        console.log('カレンダー: 取得した休診日:', holidaysData)
        console.log('カレンダー: クリニックID:', clinicId)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clinicId, selectedDate])

  // スタッフデータを読み込み（日付変更時）
  useEffect(() => {
    loadWorkingStaff(selectedDate)
  }, [selectedDate])

  // 予約ブロックの位置とサイズを計算
  const appointmentBlocks = useMemo(() => {
    const blocks: AppointmentBlock[] = []
    
    console.log('予約ブロック計算開始:', {
      appointmentsCount: appointments.length,
      workingStaffCount: workingStaff.length,
      timeSlotMinutes
    })
    console.log('予約データ:', appointments)
    console.log('出勤スタッフ:', workingStaff)
    
    // timeSlotMinutesが有効な数値でない場合はデフォルト値15を使用
    const validTimeSlotMinutes = (typeof timeSlotMinutes === 'number' && timeSlotMinutes > 0) ? timeSlotMinutes : 15
    
    appointments.forEach((appointment, index) => {
      const startTime = appointment.start_time
      const endTime = appointment.end_time
      
      console.log(`予約${index}:`, {
        startTime,
        endTime,
        staff1_id: appointment.staff1_id,
        staff2_id: appointment.staff2_id,
        staff3_id: appointment.staff3_id
      })
      
      // 時間を分に変換
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)
      
      // スタッフのインデックスを取得（staff1_id, staff2_id, staff3_idのいずれかで検索）
      let staffIndex = workingStaff.findIndex(staff => 
        staff.staff.id === appointment.staff1_id ||
        staff.staff.id === appointment.staff2_id ||
        staff.staff.id === appointment.staff3_id
      )
      
      // スタッフが見つからない場合は最初のスタッフを使用
      if (staffIndex === -1) {
        staffIndex = 0
        console.log('スタッフが見つからないため、最初のスタッフを使用:', staffIndex)
      }
      
      const top = (startMinutes - 9 * 60) / validTimeSlotMinutes * 40 // 40px per slot
      const height = (endMinutes - startMinutes) / validTimeSlotMinutes * 40
      
      console.log(`予約${index}のブロック計算:`, {
        startMinutes,
        endMinutes,
        staffIndex,
        top,
        height
      })
      
      blocks.push({
        appointment,
        top,
        height,
        staffIndex
      })
    })
    
    console.log('計算された予約ブロック数:', blocks.length)
    console.log('予約ブロック詳細:', blocks)
    
    return blocks
  }, [appointments, workingStaff, timeSlotMinutes])

  // 列の幅を計算するヘルパー関数
  const getColumnWidth = () => {
    if (workingStaff.length === 0) return '100%'
    return `${100 / workingStaff.length}%`
  }

  // 列の最小幅を計算するヘルパー関数
  const getColumnMinWidth = () => {
    // スタッフ数に応じて最小幅を調整
    if (workingStaff.length <= 2) return '200px'
    if (workingStaff.length <= 4) return '150px'
    return '120px'
  }


  // 休診日かどうかを判定
  const isHoliday = (date: Date): boolean => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // 曜日名のマッピング（英語 → 設定で使用されるID）
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek]
    console.log('休診日判定:', { dayOfWeek, dayId, holidays })
    
    return dayId ? holidays.includes(dayId) : false
  }

  // 診療時間外かどうかを判定
  const isOutsideBusinessHours = (time: string): boolean => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // 曜日名のマッピング（英語 → 設定で使用されるID）
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek] as keyof BusinessHours
    const dayHours = businessHours[dayId]
    
    // 休診日または診療時間が設定されていない場合は診療時間外
    if (!dayHours?.isOpen || !dayHours?.timeSlots || dayHours.timeSlots.length === 0) return true
    
    const timeMinutes = timeToMinutes(time)
    
    // 設定された時間枠のいずれかに含まれるかチェック
    const isWithinAnyTimeSlot = dayHours.timeSlots.some(slot => {
      const startMinutes = timeToMinutes(slot.start)
      const endMinutes = timeToMinutes(slot.end)
      return timeMinutes >= startMinutes && timeMinutes < endMinutes
    })
    
    return !isWithinAnyTimeSlot
  }

  // 休憩時間かどうかを判定
  const isBreakTime = (time: string): boolean => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // 曜日名のマッピング（英語 → 設定で使用されるID）
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek] as keyof BreakTimes
    const dayBreaks = breakTimes[dayId]
    
    if (!dayBreaks?.start || !dayBreaks?.end) return false
    
    const timeMinutes = timeToMinutes(time)
    const breakStartMinutes = timeToMinutes(dayBreaks.start)
    const breakEndMinutes = timeToMinutes(dayBreaks.end)
    
    return timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes
  }

  // 日付ナビゲーション
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
      </div>
    )
  }

  // 休診日の場合の表示
  if (isHoliday(selectedDate)) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">休診日</h3>
          <p className="text-gray-500">本日は休診日です</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white flex-1">
      {/* 左側: 時間軸 */}
      <div className="w-16 flex-shrink-0 border-r border-gray-200">
        {/* 時間軸ヘッダー */}
        <div className="h-11 border-b border-gray-200 bg-gray-50"></div>
        {/* 時間軸スクロールエリア */}
        <div 
          ref={timeAxisRef}
          className="relative h-full overflow-y-auto scrollbar-hide"
          onScroll={handleTimeAxisScroll}
        >
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className={`h-10 flex items-center justify-center text-xs text-gray-500 ${
                slot.minute === 0 ? 'font-medium' : ''
              }`}
              style={{
                borderTop: slot.minute === 0 ? '0.5px solid #6B7280' : '0.25px solid #E5E7EB'
              }}
            >
              {slot.time}
            </div>
          ))}
        </div>
      </div>

      {/* 右側: スタッフ列と予約ブロック */}
      <div className="flex-1 overflow-hidden">
        {/* スタッフヘッダー */}
        <div className="h-11 flex border-b border-gray-200">
          {staffLoading ? (
            <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          ) : staffError ? (
            <div className="flex-1 h-full flex items-center justify-center bg-red-50 text-red-600 text-sm">
              {staffError}
            </div>
          ) : workingStaff.length === 0 ? (
            <div className="flex-1 h-full flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
              出勤スタッフなし
            </div>
          ) : (
            workingStaff.map((shift, index) => {
              const isLastColumn = index === workingStaff.length - 1
              return (
                <div 
                  key={shift.staff.id} 
                  className="flex-1 border-r border-gray-200 flex items-center justify-center bg-gray-50 h-full"
                  style={{ 
                    minWidth: getColumnMinWidth(),
                    maxWidth: getColumnWidth()
                  }}
                >
                  <div className="text-center px-2">
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {shift.staff.name}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* タイムライングリッド */}
        <div 
          ref={gridRef}
          className="relative h-full overflow-y-auto scrollbar-hide"
          onScroll={handleGridScroll}
        >
          {timeSlots.map((slot, index) => {
            const isOutside = isOutsideBusinessHours(slot.time)
            const isBreak = isBreakTime(slot.time)
            const isHourBoundary = slot.minute === 0
            
            return (
              <div
                key={index}
                className={`h-10 flex ${
                  selectedTimeSlots.includes(slot.time)
                    ? isBreak 
                      ? 'bg-blue-300 border-blue-500 border-2' // 休憩時間での複数選択時はより濃い青
                      : 'bg-blue-200 border-blue-400' // 通常時間での複数選択時
                    : isOutside 
                      ? 'bg-gray-100' 
                      : isBreak 
                        ? 'bg-gray-400 cursor-pointer' 
                        : 'bg-white'
                }`}
                style={{
                  borderTop: isHourBoundary ? '0.5px solid #6B7280' : '0.25px solid #E5E7EB'
                }}
                onMouseDown={(e) => {
                  // 休憩時間や時間外でもマウスダウンを許可（選択範囲の開始）
                  handleMouseDown(slot.time, e)
                }}
                onMouseMove={() => {
                  // 休憩時間や時間外でもマウス移動を許可（選択範囲の拡張）
                  handleMouseMove(slot.time)
                }}
                onMouseUp={() => {
                  // 休憩時間や時間外でもマウスアップを許可（選択範囲の終了処理）
                  handleMouseUp()
                }}
                onClick={(e) => {
                  // 休憩時間や時間外でもクリックを許可（警告モーダルで対応）
                  // 単一クリックの場合は従来通り
                  if (!isSelecting) {
                    console.log('空のセルクリック:', slot.time, 'スタッフインデックス:', workingStaff.length > 0 ? '複数スタッフ' : 'スタッフなし', '休憩時間:', isBreak, '時間外:', isOutside)
                    setSelectedTimeSlot(slot.time)
                    setSelectedStaffIndex(undefined) // 空のセルなのでスタッフインデックスは未設定
                    setShowAppointmentModal(true)
                  }
                }}
              >
                {workingStaff.map((_, staffIndex) => {
                  const isLastColumn = staffIndex === workingStaff.length - 1
                  return (
                    <div
                      key={staffIndex}
                      className={`flex-1 border-r border-gray-200 ${
                        isBreak ? 'bg-gray-200' : ''
                      }`}
                      style={{ 
                        minWidth: getColumnMinWidth(),
                        maxWidth: getColumnWidth()
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // 休憩時間や時間外でもクリックを許可（警告モーダルで対応）
                        // スタッフ列をクリックした場合
                        console.log('スタッフ列クリック:', slot.time, 'スタッフインデックス:', staffIndex, '休憩時間:', isBreak, '時間外:', isOutside)
                        setSelectedTimeSlot(slot.time)
                        setSelectedStaffIndex(staffIndex)
                        setShowAppointmentModal(true)
                      }}
                    />
                  )
                })}
              </div>
            )
          })}

          {/* 予約ブロック */}
          {appointmentBlocks.map((block, index) => {
            const menuColor = (block.appointment as any).menu1?.color || '#3B82F6'
            const patient = (block.appointment as any).patient
            const patientAge = patient?.birth_date ? 
              new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : null
            
            return (
              <div
                key={index}
                className="absolute rounded-md p-2 text-xs cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  top: `${block.top}px`,
                  height: `${block.height}px`,
                  left: `${(block.staffIndex / workingStaff.length) * 100}%`,
                  width: getColumnWidth(),
                  minWidth: getColumnMinWidth(),
                  backgroundColor: menuColor,
                  color: 'white',
                  borderLeft: '3px solid #0288D1'
                }}
                onClick={() => {
                  // 予約編集モーダルを開く
                  console.log('予約編集:', block.appointment)
                  setSelectedTimeSlot(block.appointment.start_time)
                  setSelectedStaffIndex(block.staffIndex)
                  setShowAppointmentModal(true)
                }}
              >
                {/* 1段目: 診療時間、診察券番号 */}
                <div className="font-medium text-xs mb-1">
                  {block.appointment.start_time} - {block.appointment.end_time}
                  {patient?.patient_number && ` / ${patient.patient_number}`}
                </div>
                
                {/* 2段目: 患者名 */}
                <div className="font-medium text-sm mb-1">
                  {patient ? 
                    `${patient.last_name} ${patient.first_name}` : 
                    '患者情報なし'
                  }
                </div>
                
                {/* 3段目: 年齢、診療メニュー、担当者 */}
                <div className="text-xs opacity-90 space-y-1">
                  {/* 年齢 */}
                  {patientAge && (
                    <div>{patientAge}歳</div>
                  )}
                  
                  {/* 診療メニュー */}
                  <div>
                    {(block.appointment as any).menu1?.name || 
                     (block.appointment as any).menu2?.name || 
                     (block.appointment as any).menu3?.name || 
                     '診療メニュー'}
                  </div>
                  
                  {/* 担当者 */}
                  <div>
                    {(block.appointment as any).staff1?.name || 
                     (block.appointment as any).staff2?.name || 
                     (block.appointment as any).staff3?.name || 
                     '担当者未設定'}
                  </div>
                </div>
                
                {/* ステータスアイコン（右上） */}
                <div className="absolute top-1 right-1">
                  {block.appointment.status === '終了' && (
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xs">歯</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 予約編集モーダル */}
      <AppointmentEditModal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false)
          // モーダルが閉じられた時に選択状態をリセット
          setSelectedTimeSlots([])
          setSelectionStart(null)
          setSelectionEnd(null)
        }}
        clinicId={clinicId}
        selectedDate={formatDateForDB(selectedDate)}
        selectedTime={selectedTimeSlot}
        selectedStaffIndex={selectedStaffIndex}
        selectedTimeSlots={selectedTimeSlots}
        timeSlotMinutes={timeSlotMinutes}
        workingStaff={workingStaff}
        onSave={async (appointmentData) => {
          try {
            console.log('予約保存:', appointmentData)
            
            // 予約データを保存
            const savedAppointment = await createAppointment(clinicId, {
              ...appointmentData,
              appointment_date: formatDateForDB(selectedDate) // YYYY-MM-DD形式
            })
            
            console.log('予約保存完了:', savedAppointment)
            
            // モーダルを閉じる
            setShowAppointmentModal(false)
            
            // 選択状態をリセット
            setSelectedTimeSlots([])
            setSelectionStart(null)
            setSelectionEnd(null)
            
            // 予約一覧を再読み込み
            const dateString = formatDateForDB(selectedDate)
            const updatedAppointments = await getAppointmentsByDate(clinicId, dateString)
            setAppointments(updatedAppointments)
            
          } catch (error) {
            console.error('予約保存エラー:', error)
            alert('予約の保存に失敗しました')
          }
        }}
      />
    </div>
  )
}
