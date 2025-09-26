/**
 * 予約時間の検証ユーティリティ
 */

export interface TimeValidationResult {
  isValid: boolean
  isBreakTime: boolean
  isOutsideBusinessHours: boolean
  warningMessage?: string
}

export interface BusinessHours {
  isOpen: boolean
  timeSlots: Array<{
    start: string
    end: string
  }>
}

export interface BreakTime {
  start?: string
  end?: string
}

/**
 * 指定された時間が休憩時間かどうかを判定
 * 休憩時間の開始時刻と終了時刻は休憩時間としてカウントしない
 */
export function isBreakTime(
  time: string,
  breakTimes: BreakTime | null
): boolean {
  if (!breakTimes?.start || !breakTimes?.end) {
    return false
  }

  const timeMinutes = timeToMinutes(time)
  const breakStartMinutes = timeToMinutes(breakTimes.start)
  const breakEndMinutes = timeToMinutes(breakTimes.end)

  // 休憩時間の開始時刻と終了時刻は休憩時間としてカウントしない
  return timeMinutes > breakStartMinutes && timeMinutes < breakEndMinutes
}

/**
 * 指定された時間が診療時間外かどうかを判定
 */
export function isOutsideBusinessHours(
  time: string,
  businessHours: BusinessHours
): boolean {
  if (!businessHours.isOpen || !businessHours.timeSlots) {
    return true
  }

  const timeMinutes = timeToMinutes(time)

  return !businessHours.timeSlots.some(slot => {
    const startMinutes = timeToMinutes(slot.start)
    const endMinutes = timeToMinutes(slot.end)
    return timeMinutes >= startMinutes && timeMinutes < endMinutes
  })
}

/**
 * 時間文字列を分に変換
 * @param time "HH:MM"形式の時間文字列
 * @returns 分単位の数値
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 分を時間文字列に変換
 * @param minutes 分単位の数値
 * @returns "HH:MM"形式の時間文字列
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * 予約時間の検証を行う
 */
export function validateAppointmentTime(
  startTime: string,
  endTime: string,
  businessHours: BusinessHours,
  breakTimes: BreakTime | null,
  dayOfWeek: string
): TimeValidationResult {
  const startIsBreakTime = isBreakTime(startTime, breakTimes)
  const endIsBreakTime = isBreakTime(endTime, breakTimes)
  const startIsOutsideHours = isOutsideBusinessHours(startTime, businessHours)
  const endIsOutsideHours = isOutsideBusinessHours(endTime, businessHours)

  const isBreakTimeOverlap = startIsBreakTime || endIsBreakTime
  const isOutsideBusinessHoursOverlap = startIsOutsideHours || endIsOutsideHours

  let warningMessage = ''

  if (isBreakTimeOverlap) {
    warningMessage = `選択された時間は休憩時間（${breakTimes?.start}～${breakTimes?.end}）と重複しています。`
  } else if (isOutsideBusinessHoursOverlap) {
    const timeSlots = businessHours.timeSlots?.map(slot => `${slot.start}～${slot.end}`).join('、') || '設定なし'
    warningMessage = `選択された時間は診療時間外です。診療時間: ${timeSlots}`
  }

  return {
    isValid: !isBreakTimeOverlap && !isOutsideBusinessHoursOverlap,
    isBreakTime: isBreakTimeOverlap,
    isOutsideBusinessHours: isOutsideBusinessHoursOverlap,
    warningMessage
  }
}
