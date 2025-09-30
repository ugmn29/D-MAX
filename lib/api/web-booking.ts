import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { getTreatmentMenus } from './treatment'
import { getStaff } from './staff'
import { getAppointments } from './appointments'
import { getClinicSettings } from './clinic'
import { format, addDays, startOfWeek, parse } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * Web予約用の空き枠を取得
 */
export async function getAvailableSlots(
  clinicId: string,
  menuId: string,
  isNewPatient: boolean,
  startDate: Date,
  endDate: Date
) {
  try {
    // 診療メニューを取得
    const menus = await getTreatmentMenus(clinicId)
    const menu = menus.find(m => m.id === menuId)

    if (!menu || !menu.web_booking_enabled) {
      throw new Error('このメニューはWeb予約できません')
    }

    // 初診/再診チェック
    if (isNewPatient && !menu.web_booking_new_patient) {
      throw new Error('このメニューは初診予約できません')
    }
    if (!isNewPatient && !menu.web_booking_returning) {
      throw new Error('このメニューは再診予約できません')
    }

    // 設定を取得
    const settings = await getClinicSettings(clinicId)
    const timeSlotMinutes = settings.time_slot_minutes || 15
    const businessHours = settings.business_hours || {}
    const breakTimes = settings.break_times || {}

    // スタッフを取得
    const allStaff = await getStaff(clinicId)
    const availableStaffIds = menu.web_booking_staff_ids || []
    const availableStaff = allStaff.filter(s => availableStaffIds.includes(s.id))

    if (availableStaff.length === 0) {
      return []
    }

    // 予約時間
    const duration = menu.web_booking_duration || menu.standard_duration || 30

    // 既存の予約を取得
    const existingAppointments = await getAppointments(
      clinicId,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )

    // 日付ごとに空き枠を計算
    const slots = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dayOfWeek = format(currentDate, 'EEEE', { locale: ja }).toLowerCase()
      const dateString = format(currentDate, 'yyyy-MM-dd')

      // 診療時間を取得
      const dayBusinessHours = businessHours[dayOfWeek]

      if (!dayBusinessHours || !dayBusinessHours.isOpen || !dayBusinessHours.timeSlots) {
        currentDate = addDays(currentDate, 1)
        continue
      }

      // 休憩時間を取得
      const dayBreakTimes = breakTimes[dayOfWeek] || []

      // 各診療時間枠について
      for (const timeSlot of dayBusinessHours.timeSlots) {
        const startHour = parseInt(timeSlot.start.split(':')[0])
        const startMinute = parseInt(timeSlot.start.split(':')[1])
        const endHour = parseInt(timeSlot.end.split(':')[0])
        const endMinute = parseInt(timeSlot.end.split(':')[1])

        // 開始時刻から終了時刻まで、timeSlotMinutes間隔でチェック
        let currentTimeMinutes = startHour * 60 + startMinute
        const endTimeMinutes = endHour * 60 + endMinute

        while (currentTimeMinutes + duration <= endTimeMinutes) {
          const hour = Math.floor(currentTimeMinutes / 60)
          const minute = currentTimeMinutes % 60
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

          // 休憩時間かチェック
          const isBreakTime = dayBreakTimes.some((breakTime: any) => {
            const breakStart = parseInt(breakTime.start.split(':')[0]) * 60 + parseInt(breakTime.start.split(':')[1])
            const breakEnd = parseInt(breakTime.end.split(':')[0]) * 60 + parseInt(breakTime.end.split(':')[1])
            return currentTimeMinutes >= breakStart && currentTimeMinutes < breakEnd
          })

          if (!isBreakTime) {
            // 空いているスタッフがいるかチェック
            const availableStaffForSlot = availableStaff.filter(staff => {
              // このスタッフがこの時間に既に予約を持っているかチェック
              const hasConflict = existingAppointments.some(apt => {
                if (apt.appointment_date !== dateString) return false
                if (apt.staff1_id !== staff.id && apt.staff2_id !== staff.id && apt.staff3_id !== staff.id) return false

                const aptStart = parseInt(apt.start_time.split(':')[0]) * 60 + parseInt(apt.start_time.split(':')[1])
                const aptEnd = parseInt(apt.end_time.split(':')[0]) * 60 + parseInt(apt.end_time.split(':')[1])
                const slotEnd = currentTimeMinutes + duration

                // 重複チェック
                return !(slotEnd <= aptStart || currentTimeMinutes >= aptEnd)
              })

              return !hasConflict
            })

            slots.push({
              date: dateString,
              time: timeString,
              available: availableStaffForSlot.length > 0,
              availableStaff: availableStaffForSlot.map(s => ({ id: s.id, name: s.name }))
            })
          }

          currentTimeMinutes += timeSlotMinutes
        }
      }

      currentDate = addDays(currentDate, 1)
    }

    return slots
  } catch (error) {
    console.error('空き枠取得エラー:', error)
    throw error
  }
}

/**
 * 1週間分の空き枠を取得
 */
export async function getWeeklySlots(
  clinicId: string,
  menuId: string,
  isNewPatient: boolean,
  startDate: Date
) {
  const endDate = addDays(startDate, 6)
  return getAvailableSlots(clinicId, menuId, isNewPatient, startDate, endDate)
}