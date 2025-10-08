import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { Patient, PatientInsert, PatientUpdate } from '@/types/database'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

// 患者API関数

/**
 * 全患者を取得
 */
export async function getPatients(clinicId: string): Promise<Patient[]> {
  // MOCK_MODEの場合はlocalStorageとデータベースの両方から取得
  if (MOCK_MODE) {
    try {
      const { getMockPatients } = await import('@/lib/utils/mock-mode')
      const mockPatients = getMockPatients()
      console.log('MOCK_MODE: localStorageから患者データを取得:', mockPatients.length, '件')

      // データベースからも患者を取得
      const client = getSupabaseClient()
      const { data: dbPatients, error } = await client
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('patient_number', { ascending: true })

      if (!error && dbPatients) {
        console.log('MOCK_MODE: データベースから患者データを取得:', dbPatients.length, '件')
        // モック患者とデータベース患者をマージ（重複除去）
        const allPatients = [...mockPatients]
        dbPatients.forEach(dbPatient => {
          if (!allPatients.find(p => p.id === dbPatient.id)) {
            allPatients.push(dbPatient)
          }
        })
        console.log('MOCK_MODE: 合計患者数:', allPatients.length, '件')
        return allPatients
      }

      return mockPatients
    } catch (mockError) {
      console.error('MOCK_MODE患者データ取得エラー:', mockError)
      return []
    }
  }

  // 本番モードではデータベースから取得
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('patient_number', { ascending: true })

  if (error) {
    console.error('患者取得エラー:', error)
    throw new Error('患者データの取得に失敗しました')
  }

  return data || []
}

/**
 * 患者を検索
 */
export async function searchPatients(
  clinicId: string,
  searchQuery: string
): Promise<Patient[]> {
  const client = getSupabaseClient()
  
  // 検索クエリがない場合は全件取得
  if (!searchQuery.trim()) {
    const { data, error } = await client
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('patient_number', { ascending: true })

    if (error) {
      console.error('患者検索エラー詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`患者の検索に失敗しました: ${error.message}`)
    }

    return data || []
  }

  // 全患者を取得してクライアント側でフィルタリング
  const { data, error } = await client
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('patient_number', { ascending: true })

  if (error) {
    console.error('患者検索エラー詳細:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw new Error(`患者の検索に失敗しました: ${error.message}`)
  }

  if (!data) return []

  // クライアント側で検索フィルタリング
  const searchTerm = searchQuery.trim().toLowerCase()
  const searchNumber = Number(searchTerm)

  return data.filter(patient => {
    // 姓名で検索
    if (patient.last_name?.toLowerCase().includes(searchTerm)) return true
    if (patient.first_name?.toLowerCase().includes(searchTerm)) return true
    
    // カナで検索
    if (patient.last_name_kana?.toLowerCase().includes(searchTerm)) return true
    if (patient.first_name_kana?.toLowerCase().includes(searchTerm)) return true
    
    // 電話番号で検索
    if (patient.phone?.includes(searchTerm)) return true
    
    // 診察券番号で検索
    if (!isNaN(searchNumber) && patient.patient_number === searchNumber) return true
    
    return false
  })
}

/**
 * 患者詳細を取得
 */
export async function getPatientById(
  clinicId: string,
  patientId: string
): Promise<Patient | null> {
  // モックモードの場合もデータベースとlocalStorageの両方を確認
  if (MOCK_MODE) {
    // まずlocalStorageから検索
    const { getMockPatients } = await import('@/lib/utils/mock-mode')
    const mockPatients = getMockPatients()
    const mockPatient = mockPatients.find((p: any) => p.id === patientId && p.clinic_id === clinicId)

    if (mockPatient) {
      console.log('getPatientById (MOCK_MODE - localStorage):', { patientId, found: true })
      return mockPatient
    }

    // localStorageになければデータベースから検索
    const client = getSupabaseClient()
    const { data: dbPatient, error: dbError } = await client
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('id', patientId)
      .single()

    if (!dbError && dbPatient) {
      console.log('getPatientById (MOCK_MODE - database):', { patientId, found: true })
      return dbPatient
    }

    console.log('getPatientById (MOCK_MODE):', { patientId, found: false })
    return null
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('id', patientId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが見つからない場合
      return null
    }
    console.error('患者詳細取得エラー:', error)
    throw new Error('患者情報の取得に失敗しました')
  }

  return data
}

/**
 * 新しい患者番号を生成
 */
export async function generatePatientNumber(clinicId: string): Promise<number> {
  // モックモードの場合
  if (MOCK_MODE) {
    const { getMockPatients } = await import('@/lib/utils/mock-mode')
    const patients = getMockPatients()
    const maxNumber = patients.length > 0
      ? Math.max(...patients.map(p => p.patient_number || 0))
      : 0
    return maxNumber + 1
  }

  // 通常モードの場合
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .select('patient_number')
    .eq('clinic_id', clinicId)
    .order('patient_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('患者番号生成エラー:', error)
    throw new Error('患者番号の生成に失敗しました')
  }

  const maxNumber = data && data.length > 0 ? data[0].patient_number : 0
  return maxNumber + 1
}

/**
 * 患者を新規作成
 */
export async function createPatient(
  clinicId: string,
  patientData: Omit<PatientInsert, 'clinic_id' | 'patient_number'>
): Promise<Patient> {
  if (MOCK_MODE) {
    // モックモードの場合
    const { getMockPatients, addMockPatient } = await import('@/lib/utils/mock-mode')
    
    // 新しい患者番号を生成
    const existingPatients = getMockPatients()
    const maxNumber = existingPatients.length > 0 
      ? Math.max(...existingPatients.map(p => p.patient_number || 0))
      : 0
    const patientNumber = maxNumber + 1

    const newPatient = {
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clinic_id: clinicId,
      ...patientData,
      // patientDataのis_registeredを優先、なければpatient_numberの有無で判定
      is_registered: patientData.is_registered !== undefined 
        ? patientData.is_registered 
        : (patientData.patient_number ? true : false),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return addMockPatient(newPatient)
  }

  // 通常モードの場合
  const newPatient: PatientInsert = {
    ...patientData,
    clinic_id: clinicId,
    // patientDataのis_registeredを優先
    is_registered: patientData.is_registered !== undefined 
      ? patientData.is_registered 
      : (patientData.patient_number ? true : false)
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .insert(newPatient)
    .select()
    .single()

  if (error) {
    console.error('患者作成エラー:', error)
    throw new Error('患者の登録に失敗しました')
  }

  return data
}

/**
 * 患者情報を更新
 */
export async function updatePatient(
  clinicId: string,
  patientId: string,
  patientData: PatientUpdate
): Promise<Patient> {
  // モックモードの場合
  if (MOCK_MODE) {
    const { getMockPatients, updateMockPatient } = await import('@/lib/utils/mock-mode')

    // 更新前のデータを取得
    const patients = getMockPatients()
    const existingPatient = patients.find(p => p.id === patientId)

    if (!existingPatient) {
      console.error('患者が見つかりません:', patientId)
      throw new Error('患者情報の更新に失敗しました')
    }

    // 更新データをマージ
    const updatedPatient = {
      ...existingPatient,
      ...patientData,
      updated_at: new Date().toISOString()
    }

    // localStorageに保存
    updateMockPatient(patientId, updatedPatient)

    console.log('モックモード: 患者情報を更新しました', updatedPatient)
    return updatedPatient
  }

  // 通常モードの場合
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .update(patientData)
    .eq('clinic_id', clinicId)
    .eq('id', patientId)
    .select()
    .single()

  if (error) {
    console.error('患者更新エラー:', error)
    throw new Error('患者情報の更新に失敗しました')
  }

  return data
}

/**
 * 患者を削除（論理削除）
 */
export async function deletePatient(
  clinicId: string,
  patientId: string
): Promise<void> {
  // 論理削除として is_active フラグを false にする
  // 実際の削除ではなく、データを保持
  const { error } = await supabase
    .from('patients')
    .update({
      is_registered: false,
      updated_at: new Date().toISOString()
    })
    .eq('clinic_id', clinicId)
    .eq('id', patientId)

  if (error) {
    console.error('患者削除エラー:', error)
    throw new Error('患者の削除に失敗しました')
  }
}

/**
 * 統計情報を取得
 */
export async function getPatientsStats(clinicId: string) {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .select('is_registered')
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('統計取得エラー:', error)
    throw new Error('統計情報の取得に失敗しました')
  }

  const total = data.length
  const registered = data.filter(p => p.is_registered).length
  const temporary = total - registered

  return {
    total,
    registered,
    temporary
  }
}

// ========================================
// 連携状況管理関連
/**
 * 患者の問診表連携状況を取得
 */
export async function getPatientLinkStatus(clinicId: string): Promise<{
  unlinkedPatients: any[],
  linkedPatients: any[]
}> {
  const client = getSupabaseClient()
  
  try {
    // 仮登録患者（未連携）を取得
    const { data: unlinkedPatients, error: unlinkedError } = await client
      .from('patients')
      .select(`
        *,
        questionnaire_responses (
          id,
          questionnaire_id,
          completed_at,
          questionnaires (
            id,
            name
          )
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('is_registered', false)
      .order('created_at', { ascending: false })

    if (unlinkedError) {
      console.error('未連携患者取得エラー:', unlinkedError)
    }

    // 本登録患者（連携済み）を取得
    const { data: linkedPatients, error: linkedError } = await client
      .from('patients')
      .select(`
        *,
        questionnaire_responses (
          id,
          questionnaire_id,
          completed_at,
          questionnaires (
            id,
            name
          )
        )
      `)
      .eq('clinic_id', clinicId)
      .eq('is_registered', true)
      .order('updated_at', { ascending: false })

    if (linkedError) {
      console.error('連携済み患者取得エラー:', linkedError)
    }

    return {
      unlinkedPatients: unlinkedPatients || [],
      linkedPatients: linkedPatients || []
    }
  } catch (error) {
    console.error('連携状況取得エラー:', error)
    return {
      unlinkedPatients: [],
      linkedPatients: []
    }
  }
}

/**
 * 患者を本登録に変更（連携実行）
 */
export async function linkPatientToQuestionnaire(patientId: string): Promise<void> {
  const client = getSupabaseClient()
  
  try {
    const { error } = await client
      .from('patients')
      .update({ 
        is_registered: true,
        registered_at: new Date().toISOString()
      })
      .eq('id', patientId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('患者連携エラー:', error)
    throw error
  }
}

/**
 * 患者を仮登録に戻す（連携解除）
 */
export async function unlinkPatientFromQuestionnaire(patientId: string): Promise<void> {
  const client = getSupabaseClient()
  
  try {
    const { error } = await client
      .from('patients')
      .update({ 
        is_registered: false,
        registered_at: null
      })
      .eq('id', patientId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('患者連携解除エラー:', error)
    throw error
  }
}

// 通知設定関連
// ========================================

/**
 * 患者の希望連絡手段を取得
 */
export async function getPatientContactMethod(patientId: string): Promise<string | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .select('preferred_contact_method')
    .eq('id', patientId)
    .single()

  if (error || !data) {
    return null
  }

  return data.preferred_contact_method
}

/**
 * 患者の希望連絡手段を更新
 */
export async function updatePatientContactMethod(
  patientId: string,
  contactMethod: 'line' | 'email' | 'sms'
): Promise<void> {
  const client = getSupabaseClient()
  await client
    .from('patients')
    .update({ preferred_contact_method: contactMethod })
    .eq('id', patientId)
}

/**
 * 患者の通知設定を取得
 */
export async function getPatientNotificationPreferences(
  patientId: string
): Promise<Record<string, boolean>> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .select('notification_preferences')
    .eq('id', patientId)
    .single()

  if (error || !data) {
    return {
      appointment_reminder: true,
      treatment_reminder: true,
      periodic_checkup: true,
      other: true
    }
  }

  return data.notification_preferences || {
    appointment_reminder: true,
    treatment_reminder: true,
    periodic_checkup: true,
    other: true
  }
}

/**
 * 患者の通知設定を更新
 */
export async function updatePatientNotificationPreferences(
  patientId: string,
  preferences: Record<string, boolean>
): Promise<void> {
  const client = getSupabaseClient()
  await client
    .from('patients')
    .update({ notification_preferences: preferences })
    .eq('id', patientId)
}

/**
 * 患者の自動リマインド設定を取得
 */
export async function getPatientAutoReminderSettings(
  patientId: string
): Promise<{ enabled: boolean; custom_intervals: any }> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .select('auto_reminder_enabled, auto_reminder_custom_intervals')
    .eq('id', patientId)
    .single()

  if (error || !data) {
    return {
      enabled: true,
      custom_intervals: null
    }
  }

  return {
    enabled: data.auto_reminder_enabled ?? true,
    custom_intervals: data.auto_reminder_custom_intervals
  }
}

/**
 * 患者の自動リマインド設定を更新
 */
export async function updatePatientAutoReminderSettings(
  patientId: string,
  enabled: boolean,
  customIntervals?: any
): Promise<void> {
  const client = getSupabaseClient()
  await client
    .from('patients')
    .update({
      auto_reminder_enabled: enabled,
      auto_reminder_custom_intervals: customIntervals
    })
    .eq('id', patientId)
}