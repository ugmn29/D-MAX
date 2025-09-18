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
  const { data, error } = await supabase
    .from('clinic_settings')
    .select('setting_key, setting_value')
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('クリニック設定取得エラー:', error)
    throw new Error('クリニック設定の取得に失敗しました')
  }

  const settings: Record<string, any> = {}
  data?.forEach(setting => {
    settings[setting.setting_key] = setting.setting_value
  })

  return settings
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
  const { error } = await supabase
    .from('clinic_settings')
    .upsert({
      clinic_id: clinicId,
      setting_key: key,
      setting_value: value
    })

  if (error) {
    console.error('設定値保存エラー:', error)
    throw new Error('設定値の保存に失敗しました')
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
  const clinic = await getClinic(clinicId)
  return clinic?.business_hours || {
    monday: { isOpen: true, start: '09:00', end: '18:00' },
    tuesday: { isOpen: true, start: '09:00', end: '18:00' },
    wednesday: { isOpen: true, start: '09:00', end: '18:00' },
    thursday: { isOpen: true, start: '09:00', end: '18:00' },
    friday: { isOpen: true, start: '09:00', end: '18:00' },
    saturday: { isOpen: true, start: '09:00', end: '17:00' },
    sunday: { isOpen: false }
  }
}

/**
 * 休憩時間を取得（デフォルト値付き）
 */
export async function getBreakTimes(clinicId: string) {
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
  const clinic = await getClinic(clinicId)
  return clinic?.time_slot_minutes || 15
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
