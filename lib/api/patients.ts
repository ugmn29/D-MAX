import { supabase } from '@/lib/supabase'
import { Patient, PatientInsert, PatientUpdate } from '@/types/database'

// 患者API関数

/**
 * 全患者を取得
 */
export async function getPatients(clinicId: string): Promise<Patient[]> {
  const { data, error } = await supabase
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
  const query = supabase
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)

  // 検索クエリがあれば条件を追加
  if (searchQuery.trim()) {
    const searchTerm = searchQuery.toLowerCase()

    // 複数フィールドでOR検索
    query.or(`
      last_name.ilike.%${searchTerm}%,
      first_name.ilike.%${searchTerm}%,
      last_name_kana.ilike.%${searchTerm}%,
      first_name_kana.ilike.%${searchTerm}%,
      phone.ilike.%${searchTerm}%,
      patient_number.eq.${isNaN(Number(searchTerm)) ? -1 : Number(searchTerm)}
    `)
  }

  const { data, error } = await query.order('patient_number', { ascending: true })

  if (error) {
    console.error('患者検索エラー:', error)
    throw new Error('患者の検索に失敗しました')
  }

  return data || []
}

/**
 * 患者詳細を取得
 */
export async function getPatientById(
  clinicId: string,
  patientId: string
): Promise<Patient | null> {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  // 新しい患者番号を生成
  const patientNumber = await generatePatientNumber(clinicId)

  const newPatient: PatientInsert = {
    ...patientData,
    clinic_id: clinicId,
    patient_number: patientNumber,
    is_registered: true // 新規作成時は本登録とする
  }

  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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