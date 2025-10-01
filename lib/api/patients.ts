import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { Patient, PatientInsert, PatientUpdate } from '@/types/database'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

// 患者API関数

/**
 * 全患者を取得
 */
export async function getPatients(clinicId: string): Promise<Patient[]> {
  // MOCK_MODEの場合はlocalStorageから取得
  if (MOCK_MODE) {
    try {
      const { getMockPatients } = await import('@/lib/utils/mock-mode')
      const mockPatients = getMockPatients()
      console.log('MOCK_MODE: 患者データを取得:', mockPatients)
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
      console.error('患者検索エラー:', error)
      throw new Error('患者の検索に失敗しました')
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
    console.error('患者検索エラー:', error)
    throw new Error('患者の検索に失敗しました')
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
      patient_number: patientNumber,
      ...patientData,
      is_registered: true, // 診察券番号が振られた患者は本登録
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return addMockPatient(newPatient)
  }

  // 通常モードの場合
  // 新しい患者番号を生成
  const patientNumber = await generatePatientNumber(clinicId)

  const newPatient: PatientInsert = {
    ...patientData,
    clinic_id: clinicId,
    patient_number: patientNumber,
    is_registered: true // 新規作成時は本登録とする
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