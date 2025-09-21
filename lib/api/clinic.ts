import { supabase } from '@/lib/supabase'
import { Clinic, ClinicSettings, DailyMemo, DailyMemoInsert, DailyMemoUpdate } from '@/types/database'

/**
 * クリニック情報を取得
 */
export async function getClinic(clinicId: string): Promise<Clinic | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', clinicId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('クリニック取得エラー:', error)
    throw new Error('クリニック情報の取得に失敗しました')
  }

  return data
}

/**
 * クリニック設定を取得
 */
export async function getClinicSettings(clinicId: string): Promise<Record<string, any>> {
  console.log('getClinicSettings呼び出し:', clinicId)
  
  try {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('setting_key, setting_value')
      .eq('clinic_id', clinicId)

    console.log('getClinicSettingsレスポンス:', { data, error })

    if (error) {
      console.error('クリニック設定取得エラー:', error)
      // エラーが発生した場合はデフォルト設定を返す
      return {
        time_slot_minutes: 15,
        display_items: [],
        cell_height: 40
      }
    }

    const settings: Record<string, any> = {}
    data?.forEach(setting => {
      console.log(`設定項目: ${setting.setting_key} = ${setting.setting_value}`)
      settings[setting.setting_key] = setting.setting_value
    })

    console.log('処理後の設定:', settings)
    console.log('time_slot_minutesの値:', settings.time_slot_minutes)
    return settings
  } catch (error) {
    console.error('getClinicSettings全体エラー:', error)
    // エラーが発生した場合はデフォルト設定を返す
    return {
      time_slot_minutes: 15,
      display_items: [],
      cell_height: 40
    }
  }
}

/**
 * 特定の設定値を取得
 */
export async function getClinicSetting(
  clinicId: string,
  key: string
): Promise<any> {
  const { data, error } = await supabase
    .from('clinic_settings')
    .select('setting_value')
    .eq('clinic_id', clinicId)
    .eq('setting_key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('設定値取得エラー:', error)
    throw new Error('設定値の取得に失敗しました')
  }

  return data.setting_value
}

/**
 * 設定値を保存
 */
export async function setClinicSetting(
  clinicId: string,
  key: string,
  value: any
): Promise<void> {
  console.log('setClinicSetting呼び出し:', { clinicId, key, value })
  
  const upsertData = {
    clinic_id: clinicId,
    setting_key: key,
    setting_value: value
  }
  
  console.log('Supabaseに送信するデータ:', upsertData)
  
  const { data, error } = await supabase
    .from('clinic_settings')
    .upsert(upsertData, { onConflict: 'clinic_id,setting_key' })
    .select()

  console.log('setClinicSettingレスポンス:', { data, error })

  if (error) {
    console.error('設定値保存エラー:', error)
    console.error('エラーの詳細:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw new Error(`設定値の保存に失敗しました: ${error.message}`)
  } else {
    console.log('設定値保存成功:', data)
  }
}

/**
 * 日次メモを取得
 */
export async function getDailyMemo(
  clinicId: string,
  date: string
): Promise<DailyMemo | null> {
  const { data, error } = await supabase
    .from('daily_memos')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('date', date)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('日次メモ取得エラー:', error)
    throw new Error('日次メモの取得に失敗しました')
  }

  return data
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
  const memoData: DailyMemoInsert = {
    clinic_id: clinicId,
    date,
    memo,
    created_by: createdBy
  }

  const { data, error } = await supabase
    .from('daily_memos')
    .upsert(memoData)
    .select()
    .single()

  if (error) {
    console.error('日次メモ保存エラー:', error)
    throw new Error('日次メモの保存に失敗しました')
  }

  return data
}

/**
 * 診療時間を取得（デフォルト値付き）
 */
export async function getBusinessHours(clinicId: string) {
  console.log('getBusinessHours呼び出し:', clinicId)
  
  try {
    // まずclinic_settingsテーブルから取得を試行
    const settingsBusinessHours = await getClinicSetting(clinicId, 'business_hours')
    if (settingsBusinessHours) {
      console.log('clinic_settingsから取得した診療時間:', settingsBusinessHours)
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
    saturday: { isOpen: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
    sunday: { isOpen: false, timeSlots: [] }
  }
  
  console.log('取得した診療時間:', businessHours)
  return businessHours
}

/**
 * 休憩時間を取得（デフォルト値付き）
 */
export async function getBreakTimes(clinicId: string) {
  try {
    // まずclinic_settingsテーブルから取得を試行
    const settingsBreakTimes = await getClinicSetting(clinicId, 'break_times')
    if (settingsBreakTimes) {
      console.log('clinic_settingsから取得した休憩時間:', settingsBreakTimes)
      return settingsBreakTimes
    }
  } catch (error) {
    console.log('clinic_settingsから取得失敗、clinicテーブルから取得を試行')
  }
  
  // clinic_settingsにない場合はclinicテーブルから取得
  const clinic = await getClinic(clinicId)
  return clinic?.break_times || {
    monday: { start: '12:00', end: '13:00' },
    tuesday: { start: '12:00', end: '13:00' },
    wednesday: { start: '12:00', end: '13:00' },
    thursday: { start: '12:00', end: '13:00' },
    friday: { start: '12:00', end: '13:00' },
    saturday: { start: '12:00', end: '13:00' },
    sunday: null
  }
}

/**
 * 1コマ時間を取得（デフォルト値付き）
 */
export async function getTimeSlotMinutes(clinicId: string): Promise<number> {
  console.log('getTimeSlotMinutes呼び出し:', clinicId)
  
  try {
    // まずclinic_settingsテーブルから取得を試行
    const settingsTimeSlotMinutes = await getClinicSetting(clinicId, 'time_slot_minutes')
    if (settingsTimeSlotMinutes !== null) {
      console.log('clinic_settingsから取得した1コマ時間:', settingsTimeSlotMinutes)
      return settingsTimeSlotMinutes
    }
  } catch (error) {
    console.log('clinic_settingsから取得失敗、clinicテーブルから取得を試行')
  }
  
  // clinic_settingsにない場合はclinicテーブルから取得
  const clinic = await getClinic(clinicId)
  const timeSlotMinutes = clinic?.time_slot_minutes || 15
  
  console.log('取得した1コマ時間:', timeSlotMinutes)
  return timeSlotMinutes
}

/**
 * 休診日を取得（デフォルト値付き）
 */
export async function getHolidays(clinicId: string): Promise<string[]> {
  console.log('getHolidays呼び出し:', clinicId)
  
  try {
    const holidays = await getClinicSetting(clinicId, 'holidays')
    console.log('取得した休診日:', holidays)
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

    const { data, error } = await supabase
      .from('clinics')
      .update(updateData)
      .eq('id', clinicId)
      .select()
      .single()

    if (error) {
      console.error('クリニック設定更新エラー:', error)
      throw new Error('設定の更新に失敗しました')
    }

    return data
  } catch (error) {
    console.error('クリニック設定更新エラー:', error)
    throw error
  }
}
