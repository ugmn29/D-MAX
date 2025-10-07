import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { initializeDatabase } from '@/lib/utils/database-setup'
import { Clinic, ClinicSettings, DailyMemo, DailyMemoInsert, DailyMemoUpdate } from '@/types/database'
import { MOCK_MODE, MOCK_CLINIC_SETTINGS } from '@/lib/utils/mock-mode'

/**
 * クリニック情報を取得
 */
export async function getClinic(clinicId: string): Promise<Clinic | null> {
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: クリニック情報を返します')
    
    // localStorageから保存された設定を読み込む
    let savedSettings: any = {}
    try {
      const savedData = localStorage.getItem('mock_clinic_settings')
      if (savedData) {
        savedSettings = JSON.parse(savedData)
        console.log('モックモード: 保存された設定を読み込みました', savedSettings)
        console.log('モックモード: 保存された設定のcancel_types:', savedSettings.cancel_types)
      }
    } catch (error) {
      console.error('モックモード: localStorage読み込みエラー:', error)
    }
    
    return {
      id: clinicId,
      name: savedSettings.name || 'デモクリニック',
      name_kana: savedSettings.name_kana || '',
      phone: savedSettings.phone || '03-1234-5678',
      email: savedSettings.email || 'demo@clinic.com',
      website_url: savedSettings.website_url || '',
      postal_code: savedSettings.postal_code || '100-0001',
      prefecture: savedSettings.prefecture || '東京都',
      city: savedSettings.city || '千代田区',
      address_line: savedSettings.address_line || '千代田1-1-1',
      business_hours: savedSettings.business_hours || {
        monday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
        tuesday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
        wednesday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
        thursday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
        friday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
        saturday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
        sunday: { isOpen: false, timeSlots: [] }
      },
      break_times: savedSettings.break_times || {
        monday: [{ start: '12:00', end: '13:00' }],
        tuesday: [{ start: '12:00', end: '13:00' }],
        wednesday: [{ start: '12:00', end: '13:00' }],
        thursday: [{ start: '12:00', end: '13:00' }],
        friday: [{ start: '12:00', end: '13:00' }],
        saturday: [{ start: '12:00', end: '13:00' }],
        sunday: []
      },
      time_slot_minutes: savedSettings.time_slot_minutes || 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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
  
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: クリニック設定データを返します')
    
    // localStorageから保存された設定を読み込む
    let savedSettings = {}
    try {
      const savedData = localStorage.getItem('mock_clinic_settings')
      if (savedData) {
        savedSettings = JSON.parse(savedData)
        console.log('モックモード: 保存された設定を読み込みました', savedSettings)
        console.log('モックモード: 保存された設定のcancel_types:', savedSettings.cancel_types)
      }
    } catch (error) {
      console.error('モックモード: localStorage読み込みエラー:', error)
    }
    
    // デフォルト設定と保存された設定をマージ
    const mergedSettings = { ...MOCK_CLINIC_SETTINGS, ...savedSettings }
    console.log('モックモード: マージされた設定:', mergedSettings)
    console.log('モックモード: cancel_typesの値:', mergedSettings.cancel_types)
    return mergedSettings
  }
  
  try {
    const client = getSupabaseClient()
    console.log('使用するクライアント:', client ? 'クライアント取得成功' : 'クライアント取得失敗')
    
    const { data, error } = await client
      .from('clinic_settings')
      .select('setting_key, setting_value')
      .eq('clinic_id', clinicId)

    console.log('getClinicSettingsレスポンス:', { data, error })

    if (error) {
      console.error('クリニック設定取得エラー:', error)
      console.error('エラーの詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // テーブルが存在しない場合はデフォルト設定を返す
      console.warn('clinic_settingsテーブルが存在しません。デフォルト設定を返します。')
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
    console.error('エラーの型:', typeof error)
    console.error('エラーの詳細:', error instanceof Error ? error.message : error)
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
  const client = getSupabaseClient()
  const { data, error } = await client
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
  
  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    console.log('モックモード: クリニック設定を保存します', { key, value })
    console.log('モックモード: 保存するキー:', key, '保存する値:', value)
    
    try {
      const existingData = JSON.parse(localStorage.getItem('mock_clinic_settings') || '{}')
      console.log('モックモード: 既存の設定:', existingData)
      const updatedData = { ...existingData, [key]: value }
      console.log('モックモード: 更新後の設定:', updatedData)
      localStorage.setItem('mock_clinic_settings', JSON.stringify(updatedData))
      console.log('モックモード: 設定を保存しました', updatedData)
    } catch (error) {
      console.error('モックモード: localStorage保存エラー:', error)
    }
    
    return
  }
  
  const upsertData = {
    clinic_id: clinicId,
    setting_key: key,
    setting_value: value
  }
  
  console.log('Supabaseに送信するデータ:', upsertData)
  
  const client = getSupabaseClient()
  const { data, error } = await client
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
  // モックモードの場合はlocalStorageから取得
  if (MOCK_MODE) {
    console.log('モックモード: 日次メモデータを取得します', { clinicId, date })
    try {
      const savedMemos = localStorage.getItem('mock_daily_memos')
      if (savedMemos) {
        const memosData = JSON.parse(savedMemos)
        const memoKey = `${clinicId}_${date}`
        const memo = memosData[memoKey]
        if (memo) {
          console.log('モックモード: メモを取得しました', memo)
          return memo
        }
      }
    } catch (error) {
      console.error('モックモード: localStorage読み込みエラー:', error)
    }
    return null
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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

  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    console.log('モックモード: 日次メモを保存します', { clinicId, date, memo })
    try {
      const savedMemos = localStorage.getItem('mock_daily_memos')
      const memosData = savedMemos ? JSON.parse(savedMemos) : {}
      const memoKey = `${clinicId}_${date}`
      memosData[memoKey] = {
        ...memoData,
        id: memoKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      localStorage.setItem('mock_daily_memos', JSON.stringify(memosData))
      console.log('モックモード: メモを保存しました', memosData[memoKey])
      return memosData[memoKey]
    } catch (error) {
      console.error('モックモード: localStorage保存エラー:', error)
      throw new Error('日次メモの保存に失敗しました')
    }
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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
  
  // モックモードの場合はデフォルトの診療時間を返す
  if (MOCK_MODE) {
    console.log('モックモード: 診療時間データを返します（デフォルト値）')
    const defaultBusinessHours = {
      monday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
      tuesday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
      wednesday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
      thursday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
      friday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
      saturday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
      sunday: { isOpen: false, timeSlots: [] }
    }
    return defaultBusinessHours
  }
  
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
    saturday: { isOpen: true, timeSlots: [{ start: '09:00', end: '18:00' }] },
    sunday: { isOpen: false, timeSlots: [] }
  }
  
  console.log('取得した診療時間:', businessHours)
  return businessHours
}

/**
 * 休憩時間を取得（デフォルト値付き）
 */
export async function getBreakTimes(clinicId: string) {
  // モックモードの場合はデフォルトの休憩時間を返す
  if (MOCK_MODE) {
    console.log('モックモード: 休憩時間データを返します（デフォルト値）')
    return {
      monday: { start: '13:00', end: '14:30' },
      tuesday: { start: '13:00', end: '14:30' },
      wednesday: { start: '13:00', end: '14:30' },
      thursday: { start: '13:00', end: '14:30' },
      friday: { start: '13:00', end: '14:30' },
      saturday: { start: '13:00', end: '14:30' },
      sunday: null
    }
  }

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
    monday: { start: '13:00', end: '14:30' },
    tuesday: { start: '13:00', end: '14:30' },
    wednesday: { start: '13:00', end: '14:30' },
    thursday: { start: '13:00', end: '14:30' },
    friday: { start: '13:00', end: '14:30' },
    saturday: { start: '13:00', end: '14:30' },
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
  
  // モックモードの場合はlocalStorageから取得
  if (MOCK_MODE) {
    console.log('モックモード: 休診日データを取得します')
    try {
      const savedSettings = localStorage.getItem('mock_clinic_settings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        const holidays = settings.holidays || []
        console.log('モックモード: 取得した休診日:', holidays)
        return holidays
      }
    } catch (error) {
      console.error('モックモード: localStorage読み込みエラー:', error)
    }
    console.log('モックモード: 休診日データを返します（空配列）')
    return []
  }
  
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
  unitCount?: number
  units?: string[]
  displayItems?: string[]
  cellHeight?: number
  cancelTypes?: string[]
  penaltySettings?: any
}) {
  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    
    // localStorageに保存
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
    
    // 追加の設定項目を処理
    if (settings.unitCount !== undefined) {
      updateData.unit_count = settings.unitCount
    }
    
    if (settings.units !== undefined) {
      updateData.units = settings.units
    }
    
    if (settings.displayItems !== undefined) {
      updateData.display_items = settings.displayItems
    }
    
    if (settings.cellHeight !== undefined) {
      updateData.cell_height = settings.cellHeight
    }
    
    if (settings.cancelTypes !== undefined) {
      updateData.cancel_types = settings.cancelTypes
      console.log('モックモード: cancel_typesをupdateDataに設定:', settings.cancelTypes)
    } else {
      console.log('モックモード: cancelTypesがundefinedです')
    }
    
    if (settings.penaltySettings !== undefined) {
      updateData.penalty_settings = settings.penaltySettings
    }
    
    // localStorageに保存
    let updatedData: any = {}
    try {
      const existingData = JSON.parse(localStorage.getItem('mock_clinic_settings') || '{}')
      console.log('モックモード: 既存データ:', existingData)
      console.log('モックモード: 更新データ:', updateData)
      console.log('モックモード: 更新データの詳細:', JSON.stringify(updateData, null, 2))
      console.log('モックモード: 更新データのcancel_types:', updateData.cancel_types)
      updatedData = { ...existingData, ...updateData }
      console.log('モックモード: マージ後のデータ:', updatedData)
      console.log('モックモード: マージ後のcancel_types:', updatedData.cancel_types)
      localStorage.setItem('mock_clinic_settings', JSON.stringify(updatedData))
      console.log('モックモード: localStorageに保存完了')
    } catch (error) {
      console.error('モックモード: localStorage保存エラー:', error)
      updatedData = updateData // エラー時はupdateDataを返す
    }
    
    return updatedData
  }

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

    const client = getSupabaseClient()
    const { data, error } = await client
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
