import { getSupabaseClient } from '@/lib/utils/supabase-client'

export interface PatientNotificationPreferences {
  id: string
  patient_id: string
  clinic_id: string
  appointment_reminder: boolean
  periodic_checkup: boolean
  treatment_reminder: boolean
  appointment_change: boolean
  custom: boolean
  created_at: string
  updated_at: string
}

export interface PatientNotificationPreferencesUpdate {
  appointment_reminder?: boolean
  periodic_checkup?: boolean
  treatment_reminder?: boolean
  appointment_change?: boolean
  custom?: boolean
}

/**
 * 患者の通知受信設定を取得
 */
export async function getPatientNotificationPreferences(
  patientId: string,
  clinicId: string
): Promise<PatientNotificationPreferences | null> {
  try {
    // 一時患者IDの場合はクエリせずにnullを返す（デフォルト値を使用）
    if (patientId.startsWith('web-booking-temp-')) {
      return null
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('patient_notification_preferences')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .single()

    if (error) {
      // レコードが存在しない場合はnullを返す
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('患者通知設定取得エラー:', JSON.stringify(error, null, 2))
      // エラーがあってもnullを返してデフォルト値を使用する
      return null
    }

    return data
  } catch (error) {
    console.error('患者通知設定取得で予期しないエラー:', error)
    // エラーが発生してもnullを返してデフォルト値を使用する
    return null
  }
}

/**
 * 患者の通知受信設定を作成または更新
 */
export async function upsertPatientNotificationPreferences(
  patientId: string,
  clinicId: string,
  preferences: PatientNotificationPreferencesUpdate
): Promise<PatientNotificationPreferences | null> {
  try {
    // 一時患者IDの場合は更新せずにnullを返す
    if (patientId.startsWith('web-booking-temp-')) {
      console.log('一時患者のため通知設定は保存されません')
      return null
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('patient_notification_preferences')
      .upsert({
        patient_id: patientId,
        clinic_id: clinicId,
        ...preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'patient_id,clinic_id'
      })
      .select()
      .single()

    if (error) {
      console.error('患者通知設定更新エラー:', error)
      throw new Error('患者の通知受信設定の更新に失敗しました')
    }

    return data
  } catch (error) {
    console.error('患者通知設定更新で予期しないエラー:', error)
    throw error
  }
}

/**
 * 患者が特定の通知タイプを受信するかチェック
 */
export async function canReceiveNotification(
  patientId: string,
  clinicId: string,
  notificationType: 'appointment_reminder' | 'periodic_checkup' | 'treatment_reminder' | 'appointment_change' | 'custom'
): Promise<boolean> {
  const preferences = await getPatientNotificationPreferences(patientId, clinicId)

  // 設定が存在しない場合はデフォルトでtrueを返す
  if (!preferences) {
    return true
  }

  return preferences[notificationType]
}
