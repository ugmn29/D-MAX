import { Clinic, ClinicSettings, DailyMemo, DailyMemoInsert, DailyMemoUpdate } from '@/types/database'
// Migrated to Prisma API Routes

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * クリニック情報を取得
 */
export async function getClinic(clinicId: string): Promise<Clinic | null> {
  try {
    const response = await fetch(`${baseUrl}/api/clinics/${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) return null
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'クリニック情報の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('クリニック取得エラー:', error)
    throw error
  }
}

/**
 * クリニック設定を取得
 */
export async function getClinicSettings(clinicId: string): Promise<Record<string, any>> {
  try {
    const response = await fetch(`${baseUrl}/api/clinic/settings?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'クリニック設定の取得に失敗しました')
    }

    const { settings } = await response.json()

    // 設定を {key: value} 形式のオブジェクトに変換
    const settingsObj: Record<string, any> = {}
    for (const setting of settings || []) {
      settingsObj[setting.setting_key] = setting.setting_value
    }

    return settingsObj
  } catch (error) {
    console.error('クリニック設定取得エラー:', error)
    throw error
  }
}

/**
 * 特定の設定値を取得
 */
export async function getClinicSetting(
  clinicId: string,
  key: string
): Promise<any> {
  try {
    const response = await fetch(`${baseUrl}/api/clinic/settings?clinic_id=${clinicId}&setting_key=${key}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) return null
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '設定値の取得に失敗しました')
    }

    const { settings } = await response.json()

    if (!settings || settings.length === 0) {
      return null
    }

    return settings[0].setting_value
  } catch (error) {
    console.error('設定値取得エラー:', error)
    throw new Error('設定値の取得に失敗しました')
  }
}

/**
 * 設定値を保存
 */
export async function setClinicSetting(
  clinicId: string,
  key: string,
  value: any
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/clinic/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clinic_id: clinicId,
        setting_key: key,
        setting_value: value
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '設定値の保存に失敗しました')
    }
  } catch (error) {
    console.error('設定値保存エラー:', error)
    throw error
  }
}

/**
 * 日次メモを取得
 */
export async function getDailyMemo(
  clinicId: string,
  date: string
): Promise<DailyMemo | null> {
  try {
    const response = await fetch(`${baseUrl}/api/daily-memos?clinic_id=${clinicId}&date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) return null
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '日次メモの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('日次メモ取得エラー:', error)
    throw new Error('日次メモの取得に失敗しました')
  }
}

/**
 * 日次メモを保存
 */
export async function saveDailyMemo(
  clinicId: string,
  date: string,
  memo: string,
  createdBy?: string
): Promise<DailyMemo> {
  try {
    const response = await fetch(`${baseUrl}/api/daily-memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clinic_id: clinicId,
        date,
        memo,
        created_by: createdBy
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '日次メモの保存に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('日次メモ保存エラー:', error)
    throw new Error('日次メモの保存に失敗しました')
  }
}

/**
 * 診療時間を取得（デフォルト値付き）
 */
export async function getBusinessHours(clinicId: string) {
  try {
    // まずclinic_settingsテーブルから取得を試行
    const settingsBusinessHours = await getClinicSetting(clinicId, 'business_hours')
    if (settingsBusinessHours) {
      return settingsBusinessHours
    }
  } catch (error) {
    console.log('clinic_settingsから取得失敗、clinicテーブルから取得を試行')
  }

  // clinic_settingsにない場合はclinicテーブルから取得
  const clinic = await getClinic(clinicId)
  const businessHours = clinic?.business_hours || {
    monday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    tuesday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    wednesday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    thursday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    friday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    saturday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    sunday: { isOpen: false, timeSlots: [] }
  }

  return businessHours
}

/**
 * 診療時間から休憩時間を自動計算
 * 複数の診療時間スロットがある場合、その間のギャップを休憩時間として返す
 */
function calculateBreakTimesFromBusinessHours(businessHours: any) {
  const breakTimes: any = {}
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  days.forEach(day => {
    const dayHours = businessHours[day]

    // 休診日または診療時間スロットが2つ未満の場合は休憩時間なし
    if (!dayHours?.isOpen || !dayHours?.timeSlots || dayHours.timeSlots.length < 2) {
      breakTimes[day] = null
      return
    }

    // 時間順にソート
    const sortedSlots = [...dayHours.timeSlots].sort((a: any, b: any) => {
      const aMinutes = parseInt(a.start.split(':')[0]) * 60 + parseInt(a.start.split(':')[1])
      const bMinutes = parseInt(b.start.split(':')[0]) * 60 + parseInt(b.start.split(':')[1])
      return aMinutes - bMinutes
    })

    // 最初のスロットの終了時刻と2番目のスロットの開始時刻の間を休憩時間とする
    const firstSlotEnd = sortedSlots[0].end
    const secondSlotStart = sortedSlots[1].start

    breakTimes[day] = {
      start: firstSlotEnd,
      end: secondSlotStart
    }
  })

  return breakTimes
}

/**
 * 休憩時間を取得（診療時間から自動計算）
 * 明示的に設定された休憩時間は無視し、常に診療時間から自動計算する
 */
export async function getBreakTimes(clinicId: string) {
  // 診療時間を取得
  const businessHours = await getBusinessHours(clinicId)

  // 診療時間から休憩時間を自動計算
  const calculatedBreakTimes = calculateBreakTimesFromBusinessHours(businessHours)

  return calculatedBreakTimes
}

/**
 * 1コマ時間を取得（デフォルト値付き）
 */
export async function getTimeSlotMinutes(clinicId: string): Promise<number> {
  try {
    // まずclinic_settingsテーブルから取得を試行
    const settingsTimeSlotMinutes = await getClinicSetting(clinicId, 'time_slot_minutes')
    if (settingsTimeSlotMinutes !== null) {
      return settingsTimeSlotMinutes
    }
  } catch (error) {
    console.log('clinic_settingsから取得失敗、clinicテーブルから取得を試行')
  }

  // clinic_settingsにない場合はclinicテーブルから取得
  const clinic = await getClinic(clinicId)
  const timeSlotMinutes = clinic?.time_slot_minutes || 15

  return timeSlotMinutes
}

/**
 * 休診日を取得（デフォルト値付き）
 */
export async function getHolidays(clinicId: string): Promise<string[]> {
  try {
    const holidays = await getClinicSetting(clinicId, 'holidays')
    return holidays || []
  } catch (error) {
    console.error('休診日取得エラー:', error)
    return []
  }
}

/**
 * クリニック設定を更新
 */
export async function updateClinicSettings(clinicId: string, settings: {
  timeSlotMinutes?: number
  businessHours?: any
  breakTimes?: any
  clinicInfo?: any
  unitCount?: number
  units?: string[]
  displayItems?: string[]
  cellHeight?: number
  cancelTypes?: string[]
  penaltySettings?: any
}) {
  try {
    const updateData: any = {}

    if (settings.timeSlotMinutes !== undefined) {
      updateData.time_slot_minutes = settings.timeSlotMinutes
    }

    if (settings.businessHours !== undefined) {
      updateData.business_hours = settings.businessHours
    }

    if (settings.breakTimes !== undefined) {
      updateData.break_times = settings.breakTimes
    }

    if (settings.clinicInfo !== undefined) {
      Object.assign(updateData, settings.clinicInfo)
    }

    // clinicsテーブルの更新（timeSlotMinutes, businessHours等がある場合のみ）
    if (Object.keys(updateData).length > 0) {
      const response = await fetch(`${baseUrl}/api/clinics/${clinicId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '設定の更新に失敗しました')
      }
    }

    // clinic_settingsテーブルに個別設定を保存
    const settingsToSave: { key: string; value: any }[] = []

    if (settings.timeSlotMinutes !== undefined) {
      settingsToSave.push({ key: 'time_slot_minutes', value: settings.timeSlotMinutes })
    }
    if (settings.displayItems !== undefined) {
      settingsToSave.push({ key: 'display_items', value: settings.displayItems })
    }
    if (settings.cellHeight !== undefined) {
      settingsToSave.push({ key: 'cell_height', value: settings.cellHeight })
    }
    if (settings.cancelTypes !== undefined) {
      settingsToSave.push({ key: 'cancel_types', value: settings.cancelTypes })
    }
    if (settings.penaltySettings !== undefined) {
      settingsToSave.push({ key: 'penalty_settings', value: settings.penaltySettings })
    }

    for (const { key, value } of settingsToSave) {
      await setClinicSetting(clinicId, key, value)
    }

    return { success: true }
  } catch (error) {
    console.error('クリニック設定更新エラー:', error)
    throw error
  }
}
