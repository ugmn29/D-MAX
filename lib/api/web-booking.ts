// Migrated to Prisma API Routes
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

    // stepsを取得（優先順位ベースのチェック用）
    const steps = bookingMenu.steps || []

    console.log('空枠取得: 全スタッフ', allStaff)
    console.log('空枠取得: steps詳細', steps)

    // 各ステップにスタッフアサインメントがあることを確認
    if (steps.length === 0) {
      console.warn('Web予約可能なステップが設定されていません', { bookingMenu })
      return []
    }

    // 全ステップから必要なスタッフIDを収集（シフトチェック用）
    const allRequiredStaffIds: string[] = []
    steps.forEach((step: any) => {
      if (step.staff_assignments && Array.isArray(step.staff_assignments)) {
        step.staff_assignments.forEach((assignment: any) => {
          if (assignment.staff_id && !allRequiredStaffIds.includes(assignment.staff_id)) {
            allRequiredStaffIds.push(assignment.staff_id)
          }
        })
      }
    })

    if (allRequiredStaffIds.length === 0) {
      console.warn('Web予約可能なスタッフが設定されていません', {
        bookingMenu,
        steps
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

    // ブロック（is_block: true）を抽出
    const blockAppointments = existingAppointments.filter(apt => (apt as any).is_block === true)

    console.log('空枠取得: 全予約データ', allAppointments.length, '件')
    console.log('空枠取得: 有効な予約データ（キャンセル除外後）', existingAppointments.length, '件')
    console.log('空枠取得: ブロック', blockAppointments.length, '件')
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

      // 出勤しているスタッフのシフト情報を抽出（勤務時間含む）
      const parseTimeToMinutes = (t: string | null | undefined): number | null => {
        if (!t) return null
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
      }

      const workingStaffShifts = new Map<string, { startMinutes: number, endMinutes: number, breakStartMinutes: number | null, breakEndMinutes: number | null }>()
      staffShifts
        .filter(shift => !shift.is_holiday && shift.shift_pattern_id !== null)
        .forEach(shift => {
          const shiftPattern = (shift as any).shift_patterns
          if (shiftPattern && shiftPattern.start_time && shiftPattern.end_time) {
            workingStaffShifts.set(shift.staff_id, {
              startMinutes: parseTimeToMinutes(shiftPattern.start_time) ?? 0,
              endMinutes: parseTimeToMinutes(shiftPattern.end_time) ?? 24 * 60,
              breakStartMinutes: parseTimeToMinutes(shiftPattern.break_start),
              breakEndMinutes: parseTimeToMinutes(shiftPattern.break_end),
            })
          } else {
            // シフトパターン詳細がない場合は終日勤務扱い
            workingStaffShifts.set(shift.staff_id, {
              startMinutes: 0,
              endMinutes: 24 * 60,
              breakStartMinutes: null,
              breakEndMinutes: null,
            })
          }
        })

      const workingStaffIds = Array.from(workingStaffShifts.keys())

      console.log(`空枠取得: ${dateString}の出勤スタッフID`, workingStaffIds)

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

          // ブロックされた時間帯かチェック（スタッフに紐づいていないブロックのみ）
          const slotEndForBlock = currentTimeMinutes + duration
          const isBlockedTime = blockAppointments.some(block => {
            if (block.appointment_date !== dateString) return false
            // スタッフに紐づいていないブロックは時間帯全体を予約不可
            if (block.staff1_id) return false

            const blockStart = parseInt(block.start_time.split(':')[0]) * 60 + parseInt(block.start_time.split(':')[1])
            const blockEnd = parseInt(block.end_time.split(':')[0]) * 60 + parseInt(block.end_time.split(':')[1])

            // 重複チェック
            return !(slotEndForBlock <= blockStart || currentTimeMinutes >= blockEnd)
          })

          // 休憩時間またはブロック時間の場合は予約不可として追加
          if (isBreakTime || isBlockedTime) {
            slots.push({
              date: dateString,
              time: timeString,
              available: false,
              availableStaff: []
            })
          } else {
            // 各ステップごとに優先順位順で空いているスタッフを探す
            let allStepsHaveAvailableStaff = true
            const availableStaffByStep: any[] = []

            for (const step of steps) {
              if (!step.staff_assignments || step.staff_assignments.length === 0) {
                // スタッフアサインメントがない場合はスキップ（このステップは不要）
                continue
              }

              // 優先順位順にソート
              const sortedAssignments = [...step.staff_assignments].sort((a, b) =>
                (a.priority || 0) - (b.priority || 0)
              )

              // このステップで利用可能なスタッフを探す
              let foundAvailableStaff = false

              for (const assignment of sortedAssignments) {
                const staffId = assignment.staff_id

                // 出勤チェック
                if (!workingStaffIds.includes(staffId)) {
                  continue
                }

                // シフト勤務時間チェック（スロット全体がシフト時間内か確認）
                const staffShiftInfo = workingStaffShifts.get(staffId)
                if (staffShiftInfo) {
                  const slotEndTime = currentTimeMinutes + duration
                  // スロットがシフト勤務時間外の場合はスキップ
                  if (currentTimeMinutes < staffShiftInfo.startMinutes || slotEndTime > staffShiftInfo.endMinutes) {
                    continue
                  }
                  // スロットがシフト休憩時間と重複する場合はスキップ
                  if (staffShiftInfo.breakStartMinutes !== null && staffShiftInfo.breakEndMinutes !== null) {
                    if (!(slotEndTime <= staffShiftInfo.breakStartMinutes || currentTimeMinutes >= staffShiftInfo.breakEndMinutes)) {
                      continue
                    }
                  }
                }

                // このスタッフがこの時間に既存予約を持っているかチェック
                const slotEnd = currentTimeMinutes + duration
                const hasConflict = existingAppointments.some(apt => {
                  if (apt.appointment_date !== dateString) return false
                  if (apt.staff1_id !== staffId && apt.staff2_id !== staffId && apt.staff3_id !== staffId) return false

                  const aptStart = parseInt(apt.start_time.split(':')[0]) * 60 + parseInt(apt.start_time.split(':')[1])
                  const aptEnd = parseInt(apt.end_time.split(':')[0]) * 60 + parseInt(apt.end_time.split(':')[1])

                  // 重複チェック
                  return !(slotEnd <= aptStart || currentTimeMinutes >= aptEnd)
                })

                if (!hasConflict) {
                  // 空いているスタッフが見つかった
                  const staff = allStaff.find(s => s.id === staffId)
                  if (staff) {
                    availableStaffByStep.push({
                      id: staff.id,
                      name: staff.name,
                      priority: assignment.priority
                    })
                    foundAvailableStaff = true
                    break // このステップは空いているスタッフが見つかったので次のステップへ
                  }
                }
              }

              // このステップで空いているスタッフが見つからなかった
              if (!foundAvailableStaff) {
                allStepsHaveAvailableStaff = false
                break // 一つでもステップで全員埋まっていたら予約不可
              }
            }

            console.log(`空枠結果: ${dateString} ${timeString} - 全ステップ空き:${allStepsHaveAvailableStaff}, 利用可能スタッフ:`, availableStaffByStep)

            slots.push({
              date: dateString,
              time: timeString,
              available: allStepsHaveAvailableStaff,
              availableStaff: availableStaffByStep
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

/**
 * 予約変更モード用の空き枠を取得（Web予約メニュー設定不要）
 * 元の予約の所要時間に基づいて空き枠を返す
 */
export async function getAvailableSlotsForReschedule(
  clinicId: string,
  duration: number,
  staffId: string | null,
  startDate: Date,
  endDate: Date
) {
  try {
    // 設定を取得
    const settings = await getClinicSettings(clinicId)
    const timeSlotMinutes = settings.time_slot_minutes || 15

    // 診療時間と休憩時間を取得
    let businessHours = settings.business_hours
    let breakTimes = settings.break_times

    if (!businessHours || Object.keys(businessHours).length === 0) {
      const { getBusinessHours, getBreakTimes } = await import('./clinic')
      businessHours = await getBusinessHours(clinicId)
      breakTimes = await getBreakTimes(clinicId)
    }

    // 既存の予約を取得（キャンセルされた予約を除外）
    const allAppointments = await getAppointments(
      clinicId,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    )
    const existingAppointments = allAppointments.filter(apt => apt.status !== 'キャンセル')

    // ブロック（is_block: true）を抽出
    const blockAppointments = existingAppointments.filter(apt => (apt as any).is_block === true)

    // スタッフ情報を取得
    const allStaff = await getStaff(clinicId)

    // 日付ごとに空き枠を計算
    const slots = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dayOfWeek = format(currentDate, 'EEEE').toLowerCase()
      const dateString = format(currentDate, 'yyyy-MM-dd')

      // 診療時間を取得
      const dayBusinessHours = businessHours[dayOfWeek]

      if (!dayBusinessHours || !dayBusinessHours.isOpen || !dayBusinessHours.timeSlots) {
        currentDate = addDays(currentDate, 1)
        continue
      }

      // その日のスタッフシフトを取得
      let staffShifts = []
      try {
        staffShifts = await getStaffShiftsByDate(clinicId, dateString)
      } catch (error) {
        console.error(`予約変更空枠取得: ${dateString}のシフト取得エラー`, error)
      }

      // 出勤しているスタッフのシフト情報を抽出（勤務時間含む）
      const parseTimeToMinutes = (t: string | null | undefined): number | null => {
        if (!t) return null
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
      }

      const workingStaffShifts = new Map<string, { startMinutes: number, endMinutes: number, breakStartMinutes: number | null, breakEndMinutes: number | null }>()
      staffShifts
        .filter(shift => !shift.is_holiday && shift.shift_pattern_id !== null)
        .forEach(shift => {
          const shiftPattern = (shift as any).shift_patterns
          if (shiftPattern && shiftPattern.start_time && shiftPattern.end_time) {
            workingStaffShifts.set(shift.staff_id, {
              startMinutes: parseTimeToMinutes(shiftPattern.start_time) ?? 0,
              endMinutes: parseTimeToMinutes(shiftPattern.end_time) ?? 24 * 60,
              breakStartMinutes: parseTimeToMinutes(shiftPattern.break_start),
              breakEndMinutes: parseTimeToMinutes(shiftPattern.break_end),
            })
          } else {
            workingStaffShifts.set(shift.staff_id, {
              startMinutes: 0,
              endMinutes: 24 * 60,
              breakStartMinutes: null,
              breakEndMinutes: null,
            })
          }
        })

      const workingStaffIds = Array.from(workingStaffShifts.keys())

      // 休憩時間を取得
      const dayBreakTimes = Array.isArray(breakTimes?.[dayOfWeek]) ? breakTimes[dayOfWeek] : []

      // 各診療時間枠について
      for (const timeSlot of dayBusinessHours.timeSlots) {
        const startHour = parseInt(timeSlot.start.split(':')[0])
        const startMinute = parseInt(timeSlot.start.split(':')[1])
        const endHour = parseInt(timeSlot.end.split(':')[0])
        const endMinute = parseInt(timeSlot.end.split(':')[1])

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

          // ブロックされた時間帯かチェック（スタッフに紐づいていないブロックのみ）
          const slotEndForBlock = currentTimeMinutes + duration
          const isBlockedTime = blockAppointments.some(block => {
            if (block.appointment_date !== dateString) return false
            // スタッフに紐づいていないブロックは時間帯全体を予約不可
            if (block.staff1_id) return false

            const blockStart = parseInt(block.start_time.split(':')[0]) * 60 + parseInt(block.start_time.split(':')[1])
            const blockEnd = parseInt(block.end_time.split(':')[0]) * 60 + parseInt(block.end_time.split(':')[1])

            // 重複チェック
            return !(slotEndForBlock <= blockStart || currentTimeMinutes >= blockEnd)
          })

          if (isBreakTime || isBlockedTime) {
            slots.push({
              date: dateString,
              time: timeString,
              available: false,
              availableStaff: []
            })
          } else {
            // 担当者指定がある場合はその担当者のみチェック
            // 指定がない場合は時間枠のみチェック
            let isAvailable = true
            const availableStaffList: any[] = []

            if (staffId) {
              // 担当者出勤チェック
              if (!workingStaffIds.includes(staffId)) {
                isAvailable = false
              } else {
                // 担当者のシフト勤務時間チェック
                const staffShiftInfo = workingStaffShifts.get(staffId)
                const slotEnd = currentTimeMinutes + duration

                if (staffShiftInfo) {
                  if (currentTimeMinutes < staffShiftInfo.startMinutes || slotEnd > staffShiftInfo.endMinutes) {
                    isAvailable = false
                  } else if (staffShiftInfo.breakStartMinutes !== null && staffShiftInfo.breakEndMinutes !== null) {
                    if (!(slotEnd <= staffShiftInfo.breakStartMinutes || currentTimeMinutes >= staffShiftInfo.breakEndMinutes)) {
                      isAvailable = false
                    }
                  }
                }

                if (isAvailable) {
                  // 担当者の予約重複チェック
                  const hasConflict = existingAppointments.some(apt => {
                    if (apt.appointment_date !== dateString) return false
                    if (apt.staff1_id !== staffId && apt.staff2_id !== staffId && apt.staff3_id !== staffId) return false

                    const aptStart = parseInt(apt.start_time.split(':')[0]) * 60 + parseInt(apt.start_time.split(':')[1])
                    const aptEnd = parseInt(apt.end_time.split(':')[0]) * 60 + parseInt(apt.end_time.split(':')[1])

                    return !(slotEnd <= aptStart || currentTimeMinutes >= aptEnd)
                  })

                  if (hasConflict) {
                    isAvailable = false
                  } else {
                    const staff = allStaff.find(s => s.id === staffId)
                    if (staff) {
                      availableStaffList.push({
                        id: staff.id,
                        name: staff.name
                      })
                    }
                  }
                }
              }
            } else {
              // 担当者指定なし：単純に診療時間内かどうかのみチェック
              isAvailable = true
            }

            slots.push({
              date: dateString,
              time: timeString,
              available: isAvailable,
              availableStaff: availableStaffList
            })
          }

          currentTimeMinutes += timeSlotMinutes
        }
      }

      currentDate = addDays(currentDate, 1)
    }

    return slots
  } catch (error) {
    console.error('予約変更用空き枠取得エラー:', error)
    throw error
  }
}

/**
 * 予約変更モード用の1週間分の空き枠を取得
 */
export async function getWeeklySlotsForReschedule(
  clinicId: string,
  duration: number,
  staffId: string | null,
  startDate: Date
) {
  const endDate = addDays(startDate, 6)
  return getAvailableSlotsForReschedule(clinicId, duration, staffId, startDate, endDate)
}