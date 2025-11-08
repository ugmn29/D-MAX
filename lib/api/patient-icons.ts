import { getSupabaseClient } from '@/lib/utils/supabase-client'

export interface PatientIcons {
  id: string
  patient_id: string
  clinic_id: string
  icon_ids: string[]
  created_at: string
  updated_at: string
}

/**
 * 患者の特記事項アイコンを取得
 */
export async function getPatientIcons(
  patientId: string,
  clinicId: string
): Promise<PatientIcons | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('patient_icons')
    .select('*')
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが存在しない場合はnullを返す
      return null
    }
    console.error('患者アイコンの取得エラー:', error)
    throw error
  }

  return data
}

/**
 * 患者の特記事項アイコンを保存（upsert）
 */
export async function upsertPatientIcons(
  patientId: string,
  clinicId: string,
  iconIds: string[]
): Promise<PatientIcons> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('patient_icons')
    .upsert(
      {
        patient_id: patientId,
        clinic_id: clinicId,
        icon_ids: iconIds,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'patient_id,clinic_id'
      }
    )
    .select()
    .single()

  if (error) {
    console.error('患者アイコンの保存エラー:', error)
    throw error
  }

  return data
}

/**
 * 患者の特記事項アイコンを削除
 */
export async function deletePatientIcons(
  patientId: string,
  clinicId: string
): Promise<void> {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('patient_icons')
    .delete()
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('患者アイコンの削除エラー:', error)
    throw error
  }
}
