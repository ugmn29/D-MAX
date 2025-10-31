import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { getTreatmentMenus } from './treatment'
import { getStaff } from './staff'
import { getAppointments } from './appointments'
import { getClinicSettings } from './clinic'
import { getStaffShiftsByDate } from './shifts'
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
    // 設定を取得してWeb予約メニューを確認
    const settings = await getClinicSettings(clinicId)
    const webReservation = settings.web_reservation || {}
    const bookingMenus = webReservation.booking_menus || []

    console.log('空枠取得: 全Web予約メニュー', bookingMenus)
    console.log('空枠取得: 検索対象のmenuId', menuId)

    // Web予約メニューから対象メニューを取得
    const bookingMenu = bookingMenus.find((m: any) => m.treatment_menu_id === menuId)

    console.log('空枠取得: 見つかったメニュー', bookingMenu)

    if (!bookingMenu) {
      console.error('空枠取得: メニューが見つかりません', { menuId, bookingMenus })
      throw new Error('このメニューはWeb予約できません')
    }

    // 初診/再診チェック
    if (isNewPatient && bookingMenu.allow_new_patient === false) {
      throw new Error('このメニューは初診予約できません')
    }
    if (!isNewPatient && bookingMenu.allow_returning === false) {
      throw new Error('このメニューは再診予約できません')
    }

    const timeSlotMinutes = settings.time_slot_minutes || 15

    console.log('空枠取得: settings.business_hours', settings.business_hours)
    console.log('空枠取得: settings.break_times', settings.break_times)

    // 診療時間と休憩時間を取得（settingsになければAPIから取得）
    let businessHours = settings.business_hours
    let breakTimes = settings.break_times

    if (!businessHours || Object.keys(businessHours).length === 0) {
      console.log('空枠取得: settingsにbusiness_hoursがないため、APIから取得します')
      const { getBusinessHours, getBreakTimes } = await import('./clinic')
      businessHours = await getBusinessHours(clinicId)
      breakTimes = await getBreakTimes(clinicId)
      console.log('空枠取得: APIから取得した診療時間', businessHours)
      console.log('空枠取得: APIから取得した休憩時間', breakTimes)
    } else {
      console.log('空枠取得: settingsからbusiness_hoursを使用します', businessHours)
      breakTimes = breakTimes || {}
    }

    console.log('空枠取得: 最終的なbusinessHours', businessHours)
    console.log('空枠取得: 最終的なbreakTimes', breakTimes)

    // スタッフを取得
    const allStaff = await getStaff(clinicId)

    // stepsからstaff_assignmentsを集めてスタッフIDを抽出
    const availableStaffIds: string[] = []
    if (bookingMenu.steps && Array.isArray(bookingMenu.steps)) {
      bookingMenu.steps.forEach((step: any) => {
        if (step.staff_assignments && Array.isArray(step.staff_assignments)) {
          step.staff_assignments.forEach((assignment: any) => {
            if (assignment.staff_id && !availableStaffIds.includes(assignment.staff_id)) {
              availableStaffIds.push(assignment.staff_id)
            }
          })
        }
      })
    }

    console.log('空枠取得: 全スタッフ', allStaff)
    console.log('空枠取得: stepsから抽出したstaff_ids', availableStaffIds)
    console.log('空枠取得: steps詳細', bookingMenu.steps)

    const availableStaff = allStaff.filter(s => availableStaffIds.includes(s.id))

    console.log('空枠取得: Web予約可能なスタッフ', availableStaff)

    if (availableStaff.length === 0) {
      console.warn('Web予約可能なスタッフが設定されていません', {
        bookingMenu,
        availableStaffIds,
        allStaff: allStaff.map(s => ({ id: s.id, name: s.name }))
      })
      return []
    }

    // 予約時間
    const duration = bookingMenu.duration || 30

    // 既存の予約を取得（キャンセルされた予約を除外）
    const allAppointments = await getAppointments(
      clinicId,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )
    const existingAppointments = allAppointments.filter(apt => apt.status !== 'キャンセル')
    console.log('空枠取得: 全予約データ', allAppointments.length, '件')
    console.log('空枠取得: 有効な予約データ（キャンセル除外後）', existingAppointments.length, '件')
    console.log('空枠取得: 予約詳細', existingAppointments.map(a => ({
      date: a.appointment_date,
      time: `${a.start_time}-${a.end_time}`,
      status: a.status,
      staff1: a.staff1_id,
      staff2: a.staff2_id,
      staff3: a.staff3_id
    })))

    // 日付ごとに空き枠を計算
    const slots = []
    let currentDate = new Date(startDate)

    console.log('空枠取得: 日付ループ開始', {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      currentDate: format(currentDate, 'yyyy-MM-dd')
    })

    while (currentDate <= endDate) {
      const dayOfWeek = format(currentDate, 'EEEE').toLowerCase()
      const dateString = format(currentDate, 'yyyy-MM-dd')

      console.log(`空枠取得: ${dateString} (${dayOfWeek}) のチェック開始`)

      // 診療時間を取得
      const dayBusinessHours = businessHours[dayOfWeek]

      console.log(`空枠取得: ${dateString}の診療時間`, dayBusinessHours)

      if (!dayBusinessHours || !dayBusinessHours.isOpen || !dayBusinessHours.timeSlots) {
        console.log(`空枠取得: ${dateString}は休診日のためスキップ`)
        currentDate = addDays(currentDate, 1)
        continue
      }

      // その日のスタッフシフトを取得
      let staffShifts = []
      try {
        staffShifts = await getStaffShiftsByDate(clinicId, dateString)
        console.log(`空枠取得: ${dateString}のシフト`, staffShifts)
      } catch (error) {
        console.error(`空枠取得: ${dateString}のシフト取得エラー`, error)
      }

      // 出勤しているスタッフのIDを抽出
      const workingStaffIds = staffShifts
        .filter(shift => !shift.is_holiday && shift.shift_pattern_id !== null)
        .map(shift => shift.staff_id)

      console.log(`空枠取得: ${dateString}の出勤スタッフID`, workingStaffIds)

      // Web予約可能で、かつ出勤しているスタッフのみに絞る
      const workingAvailableStaff = availableStaff.filter(staff => workingStaffIds.includes(staff.id))

      console.log(`空枠取得: ${dateString}のWeb予約可能＆出勤スタッフ`, workingAvailableStaff)

      // 出勤スタッフが0人の場合、その日は全てスキップ
      if (workingAvailableStaff.length === 0) {
        console.warn(`空枠取得: ${dateString}は出勤スタッフがいないためスキップ`)
        currentDate = addDays(currentDate, 1)
        continue
      }

      // 休憩時間を取得
      const dayBreakTimes = Array.isArray(breakTimes?.[dayOfWeek]) ? breakTimes[dayOfWeek] : []

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

          // 休憩時間の場合は予約不可として追加
          if (isBreakTime) {
            slots.push({
              date: dateString,
              time: timeString,
              available: false,
              availableStaff: []
            })
          } else {
            // 空いているスタッフがいるかチェック（出勤しているスタッフのみ）
            const availableStaffForSlot = workingAvailableStaff.filter(staff => {
              // このスタッフがこの時間に既に予約を持っているかチェック
              const conflictingAppointments = existingAppointments.filter(apt => {
                if (apt.appointment_date !== dateString) return false
                if (apt.staff1_id !== staff.id && apt.staff2_id !== staff.id && apt.staff3_id !== staff.id) return false

                const aptStart = parseInt(apt.start_time.split(':')[0]) * 60 + parseInt(apt.start_time.split(':')[1])
                const aptEnd = parseInt(apt.end_time.split(':')[0]) * 60 + parseInt(apt.end_time.split(':')[1])
                const slotEnd = currentTimeMinutes + duration

                // 重複チェック
                return !(slotEnd <= aptStart || currentTimeMinutes >= aptEnd)
              })

              const hasConflict = conflictingAppointments.length > 0

              if (conflictingAppointments.length > 0) {
                console.log(`空枠チェック: ${dateString} ${timeString} スタッフ${staff.name} - 重複あり`, conflictingAppointments.map(a => `${a.start_time}-${a.end_time}`))
              }

              return !hasConflict
            })

            console.log(`空枠結果: ${dateString} ${timeString} - 利用可能スタッフ数:${availableStaffForSlot.length} (出勤中:${workingAvailableStaff.length})`)

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

    console.log('空枠取得: 日付ループ終了、生成されたスロット数:', slots.length)
    console.log('空枠取得: 最初の5スロット', slots.slice(0, 5))

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