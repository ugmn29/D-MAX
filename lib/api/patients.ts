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

      // データベースからも患者を取得
      const client = getSupabaseClient()
      const { data: dbPatients, error } = await client
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('patient_number', { ascending: true })

      if (!error && dbPatients) {
        // モック患者とデータベース患者をマージ（重複除去）
        const allPatients = [...mockPatients]
        dbPatients.forEach(dbPatient => {
          if (!allPatients.find(p => p.id === dbPatient.id)) {
            allPatients.push(dbPatient)
          }
        })
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
      return dbPatient
    }

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
    .not('patient_number', 'is', null)  // NULL値を除外
    .order('patient_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('患者番号生成エラー:', error)
    throw new Error('患者番号の生成に失敗しました')
  }

  const maxNumber = data && data.length > 0 && data[0].patient_number != null ? data[0].patient_number : 0
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

    // is_registeredを判定
    const isRegistered = patientData.is_registered !== undefined
      ? patientData.is_registered
      : (patientData.patient_number ? true : false)

    // 本登録の場合のみ患者番号を生成
    let patientNumber = null
    if (isRegistered) {
      const existingPatients = getMockPatients()
      const maxNumber = existingPatients.length > 0
        ? Math.max(...existingPatients.map(p => p.patient_number || 0))
        : 0
      patientNumber = maxNumber + 1
    }

    const newPatient = {
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clinic_id: clinicId,
      ...patientData,
      patient_number: patientNumber,
      is_registered: isRegistered,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return addMockPatient(newPatient)
  }

  // 通常モードの場合
  // is_registeredを判定
  const isRegistered = patientData.is_registered !== undefined
    ? patientData.is_registered
    : (patientData.patient_number ? true : false)

  // 本登録の場合のみ患者番号を生成
  let patientNumber = null
  if (isRegistered) {
    if (patientData.patient_number) {
      patientNumber = patientData.patient_number
    } else {
      patientNumber = await generatePatientNumber(clinicId)
    }
  }

  const newPatient: PatientInsert = {
    ...patientData,
    clinic_id: clinicId,
    patient_number: patientNumber,
    // 空文字列をnullに変換（日付型・ENUM型フィールド対策）
    birth_date: patientData.birth_date || null,
    email: patientData.email || null,
    gender: patientData.gender || null,
    is_registered: isRegistered
  }

  console.log('患者作成データ:', JSON.stringify(newPatient, null, 2))

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patients')
    .insert(newPatient)
    .select()
    .single()

  if (error) {
    console.error('患者作成エラー詳細:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      patient_number: patientNumber,
      clinic_id: clinicId
    })
    throw new Error(`患者の登録に失敗しました: ${error.message}`)
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

  // データベースに存在しないフィールドを除外とマッピング
  const updateData = { ...patientData }

  // フィールド名をデータベースのカラム名にマッピング（削除前に実行）
  if ((updateData as any).assigned_dh !== undefined) {
    (updateData as any).primary_hygienist_id = (updateData as any).assigned_dh || null
  }
  if ((updateData as any).primary_doctor !== undefined) {
    (updateData as any).primary_doctor_id = (updateData as any).primary_doctor || null
  }

  // 空文字列をnullに変換（チェック制約対策）
  if ((updateData as any).preferred_contact_method === '') {
    (updateData as any).preferred_contact_method = null
  }

  // データベースに存在しないフィールドを削除
  delete (updateData as any).patient_icons  // 患者アイコンは別テーブル
  delete (updateData as any).family_members // 家族連携は別テーブル
  delete (updateData as any).icon_ids       // アイコンIDは別テーブル
  delete (updateData as any).assigned_dh    // primary_hygienist_idにマッピング済み
  delete (updateData as any).primary_doctor // primary_doctor_idにマッピング済み
  delete (updateData as any).special_notes  // 特記事項は患者アイコンで管理

  const { data, error } = await client
    .from('patients')
    .update(updateData)
    .eq('clinic_id', clinicId)
    .eq('id', patientId)
    .select()
    .single()

  if (error) {
    console.error('患者更新エラー:', error.message)
    throw new Error(`患者情報の更新に失敗しました: ${error.message}`)
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
    // 仮登録患者（未連携）を取得 - シンプルなクエリに変更
    const { data: unlinkedPatients, error: unlinkedError } = await client
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_registered', false)
      .order('created_at', { ascending: false })

    if (unlinkedError) {
      console.error('未連携患者取得エラー:', unlinkedError)
      throw unlinkedError
    }

    // 本登録患者（連携済み）を取得 - シンプルなクエリに変更
    const { data: linkedPatients, error: linkedError } = await client
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_registered', true)
      .order('updated_at', { ascending: false })

    if (linkedError) {
      console.error('連携済み患者取得エラー:', linkedError)
      throw linkedError
    }

    const result = {
      unlinkedPatients: unlinkedPatients || [],
      linkedPatients: linkedPatients || []
    }

    return result
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
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)

    if (error) {
      console.error('❌ Supabaseエラー:', error)
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

    // 1. 患者を仮登録に戻す
    const { error: patientError } = await client
      .from('patients')
      .update({
        is_registered: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)

    if (patientError) {
      console.error('❌ 患者更新エラー:', patientError)
      throw patientError
    }


    // 2. この患者に紐づいている問診票のpatient_idをnullに戻す
    const { error: questionnaireError } = await client
      .from('questionnaire_responses')
      .update({
        patient_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', patientId)

    if (questionnaireError) {
      console.error('❌ 問診票連携解除エラー:', questionnaireError)
      throw questionnaireError
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

/**
 * 再診患者の認証
 * 診察券番号 OR 電話番号 OR メールアドレス（いずれか1つ） + 生年月日で認証
 */
export async function authenticateReturningPatient(
  clinicId: string,
  authData: {
    patientNumber?: string
    phone?: string
    email?: string
    birthdate: string // YYYY-MM-DD形式
  }
): Promise<Patient | null> {
  const client = getSupabaseClient()

  // 検索条件を構築
  let query = client
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('birthdate', authData.birthdate)
    .eq('is_registered', true) // 本登録済みの患者のみ

  // 診察券番号、電話番号、メールアドレスのいずれか1つで検索
  const conditions = []
  if (authData.patientNumber) {
    conditions.push({ patient_number: authData.patientNumber })
  }
  if (authData.phone) {
    conditions.push({ phone: authData.phone })
  }
  if (authData.email) {
    conditions.push({ email: authData.email })
  }

  // OR条件で検索（生年月日は必須）
  if (conditions.length === 0) {
    return null
  }

  try {
    // モックモードの場合
    if (MOCK_MODE) {
      const { getMockPatients } = await import('@/lib/utils/mock-mode')
      const mockPatients = getMockPatients()

      // localStorageから検索
      const matchedPatient = mockPatients.find((patient: Patient) => {
        if (patient.clinic_id !== clinicId) return false
        if (patient.birthdate !== authData.birthdate) return false
        if (!patient.is_registered) return false

        // 診察券番号、電話番号、メールアドレスのいずれかが一致
        if (authData.patientNumber && patient.patient_number?.toString() === authData.patientNumber) return true
        if (authData.phone && patient.phone === authData.phone) return true
        if (authData.email && patient.email === authData.email) return true

        return false
      })

      if (matchedPatient) {
        console.log('患者認証成功 (MOCK_MODE - localStorage):', matchedPatient.id)
        return matchedPatient
      }

      // localStorageになければデータベースから検索
      const { data: dbPatients, error: dbError } = await client
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('birthdate', authData.birthdate)
        .eq('is_registered', true)

      if (!dbError && dbPatients && dbPatients.length > 0) {
        const matchedDbPatient = dbPatients.find((patient: Patient) => {
          if (authData.patientNumber && patient.patient_number?.toString() === authData.patientNumber) return true
          if (authData.phone && patient.phone === authData.phone) return true
          if (authData.email && patient.email === authData.email) return true
          return false
        })

        if (matchedDbPatient) {
          console.log('患者認証成功 (MOCK_MODE - database):', matchedDbPatient.id)
          return matchedDbPatient
        }
      }

      console.log('患者認証失敗 (MOCK_MODE): 一致する患者が見つかりません')
      return null
    }

    // 通常モード: データベースから検索
    const { data: patients, error } = await client
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('birth_date', authData.birthdate)
      .eq('is_registered', true)

    if (error) {
      console.error('患者認証エラー:', error)
      return null
    }

    if (!patients || patients.length === 0) {
      return null
    }

    // 診察券番号、電話番号、メールアドレスのいずれかが一致する患者を検索
    const matchedPatient = patients.find((patient: Patient) => {
      if (authData.patientNumber && patient.patient_number?.toString() === authData.patientNumber) return true
      if (authData.phone && patient.phone === authData.phone) return true
      if (authData.email && patient.email === authData.email) return true
      return false
    })

    return matchedPatient || null
  } catch (error) {
    console.error('患者認証処理エラー:', error)
    return null
  }
}