'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, User, Heart, Zap, Smile } from 'lucide-react'
import { getAppointmentsByDate } from '@/lib/api/appointments'
// import { getWorkingStaffByDate } from '@/lib/api/shifts' // TODO: 実装予定
import { getBusinessHours, getBreakTimes, getTimeSlotMinutes, getHolidays, getClinicSettings } from '@/lib/api/clinic'
import { Appointment, BusinessHours, BreakTimes } from '@/types/database'

interface MainCalendarProps {
  clinicId: string
  selectedDate: Date
  onDateChange: (date: Date) => void
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

export function MainCalendar({ clinicId, selectedDate, onDateChange }: MainCalendarProps) {
  const [workingStaff, setWorkingStaff] = useState<any[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours>({})
  const [breakTimes, setBreakTimes] = useState<BreakTimes>({})
  const [timeSlotMinutes, setTimeSlotMinutes] = useState(15)
  const [holidays, setHolidays] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // 時間スロットを生成
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = []
    const startHour = 9
    const endHour = 18
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeSlotMinutes) {
        if (hour === endHour && minute > 0) break
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          hour,
          minute
        })
      }
    }
    return slots
  }, [timeSlotMinutes])

  // データを読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const dateString = selectedDate.toISOString().split('T')[0]
        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof BusinessHours
        
        const [appointmentsData, businessHoursData, breakTimesData, timeSlotData, holidaysData] = await Promise.all([
          getAppointmentsByDate(clinicId, dateString),
          getBusinessHours(clinicId),
          getBreakTimes(clinicId),
          getTimeSlotMinutes(clinicId),
          getHolidays(clinicId)
        ])

        // スタッフデータは一時的に空配列で設定（TODO: 実装予定）
        setWorkingStaff([])
        setAppointments(appointmentsData)
        setBusinessHours(businessHoursData)
        setBreakTimes(breakTimesData)
        setTimeSlotMinutes(timeSlotData)
        setHolidays(holidaysData)

        console.log('カレンダー: 取得した時間設定:', timeSlotData)
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

  // 予約ブロックの位置とサイズを計算
  const appointmentBlocks = useMemo(() => {
    const blocks: AppointmentBlock[] = []
    
    appointments.forEach(appointment => {
      const startTime = appointment.start_time
      const endTime = appointment.end_time
      
      // 時間を分に変換
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)
      
      // スタッフのインデックスを取得
      const staffIndex = workingStaff.findIndex(staff => 
        staff.staff.id === appointment.staff1_id
      )
      
      if (staffIndex !== -1) {
        const top = (startMinutes - 9 * 60) / timeSlotMinutes * 40 // 40px per slot
        const height = (endMinutes - startMinutes) / timeSlotMinutes * 40
        
        blocks.push({
          appointment,
          top,
          height,
          staffIndex
        })
      }
    })
    
    return blocks
  }, [appointments, workingStaff, timeSlotMinutes])

  // 時間を分に変換するヘルパー関数
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // 休診日かどうかを判定
  const isHoliday = (date: Date): boolean => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    return holidays.includes(dayOfWeek)
  }

  // 診療時間外かどうかを判定
  const isOutsideBusinessHours = (time: string): boolean => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof BusinessHours
    const dayHours = businessHours[dayOfWeek]
    
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
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof BreakTimes
    const dayBreaks = breakTimes[dayOfWeek]
    
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
    <div className="h-screen flex bg-white">
      {/* 左側: 時間軸 */}
      <div className="w-16 flex-shrink-0 border-r border-gray-300">
        <div className="h-12 border-b border-gray-300"></div> {/* スタッフヘッダー分のスペース */}
        <div className="relative">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className={`h-10 flex items-center justify-center text-xs text-gray-500 ${
                slot.minute === 0 ? 'font-medium' : ''
              }`}
            >
              {slot.minute === 0 && slot.time}
            </div>
          ))}
        </div>
      </div>

      {/* 右側: スタッフ列と予約ブロック */}
      <div className="flex-1 overflow-hidden">
        {/* スタッフヘッダー */}
        <div className="h-12 flex border-b border-gray-300">
          {workingStaff.map((shift, index) => (
            <div key={index} className="flex-1 border-r border-gray-300 flex items-center justify-center bg-gray-50">
              <span className="text-sm font-medium text-gray-700">
                {shift.staff.name}
              </span>
            </div>
          ))}
        </div>

        {/* タイムライングリッド */}
        <div className="relative h-full overflow-y-auto">
          {timeSlots.map((slot, index) => {
            const isOutside = isOutsideBusinessHours(slot.time)
            const isBreak = isBreakTime(slot.time)
            
            return (
              <div
                key={index}
                className={`h-10 flex ${
                  isOutside 
                    ? 'bg-gray-50' 
                    : isBreak 
                      ? 'bg-gray-200' 
                      : 'bg-white'
                }`}
              >
                {workingStaff.map((_, staffIndex) => (
                  <div
                    key={staffIndex}
                    className={`flex-1 border-r border-gray-300 ${
                      slot.minute === 0 ? 'border-b-2 border-gray-400' : 'border-b border-gray-200'
                    }`}
                  />
                ))}
              </div>
            )
          })}

          {/* 予約ブロック */}
          {appointmentBlocks.map((block, index) => {
            const menuColor = block.appointment.menu1?.color || '#3B82F6'
            
            return (
              <div
                key={index}
                className="absolute rounded-md p-2 text-xs cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  top: `${block.top + 48}px`, // ヘッダー分を追加
                  height: '80px', // 固定高さ
                  left: `${(block.staffIndex / workingStaff.length) * 100}%`,
                  width: `${100 / workingStaff.length}%`,
                  backgroundColor: menuColor,
                  color: 'white'
                }}
                onClick={() => {
                  // 予約編集モーダルを開く
                  console.log('予約編集:', block.appointment)
                }}
              >
                <div className="font-medium text-sm">
                  {block.appointment.start_time} - {block.appointment.end_time} / {block.appointment.patient?.patient_number || '1'}
                </div>
                <div className="mt-1 text-sm">
                  {block.appointment.patient ? 
                    `${block.appointment.patient.last_name} ${block.appointment.patient.first_name}` : 
                    '患者情報なし'
                  }
                </div>
                <div className="mt-1 text-sm">
                  {block.appointment.patient?.name_kana && `${block.appointment.patient.name_kana}`}
                </div>
                <div className="mt-1 text-sm">
                  {block.appointment.patient?.birth_date && 
                    `${new Date().getFullYear() - new Date(block.appointment.patient.birth_date).getFullYear()}歳`
                  }
                </div>
                <div className="mt-1 text-sm">
                  {block.appointment.menu1?.name || '診療メニューなし'}
                </div>
                <div className="mt-1 text-sm">
                  {block.appointment.staff1?.name || '担当者なし'}
                </div>
                
                {/* 特記事項アイコン */}
                <div className="flex items-center space-x-1 mt-2">
                  <Clock className="w-3 h-3" />
                  <User className="w-3 h-3" />
                  <Heart className="w-3 h-3" />
                  <Zap className="w-3 h-3" />
                  <Smile className="w-3 h-3" />
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
    </div>
  )
}
