import { supabase } from '@/lib/supabase'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

export interface PatientAlertNote {
  id: string
  text: string
  created_at: string
}

const LOCAL_STORAGE_KEY_PREFIX = 'patient_alert_notes_'

// 患者の注意事項を取得
export async function getPatientAlertNotes(patientId: string): Promise<PatientAlertNote[]> {
  // モックモード: ローカルストレージから取得
  if (MOCK_MODE) {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + patientId)
      if (stored) {
        const notes = JSON.parse(stored)
        return Array.isArray(notes) ? notes : []
      }
      return []
    } catch (error) {
      console.error('Error fetching patient alert notes from localStorage:', error)
      return []
    }
  }

  // 通常モード: データベースから取得
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('alert_notes')
      .eq('id', patientId)
      .single()

    if (error) {
      console.error('Error fetching patient alert notes:', error)
      return []
    }

    if (!patient?.alert_notes) {
      return []
    }

    try {
      const notes = JSON.parse(patient.alert_notes)
      return Array.isArray(notes) ? notes : []
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error fetching patient alert notes:', error)
    return []
  }
}

// 患者の注意事項を更新
export async function updatePatientAlertNotes(
  patientId: string,
  notes: PatientAlertNote[]
): Promise<boolean> {
  // モックモード: ローカルストレージに保存
  if (MOCK_MODE) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + patientId, JSON.stringify(notes))
      return true
    } catch (error) {
      console.error('Error updating patient alert notes in localStorage:', error)
      return false
    }
  }

  // 通常モード: データベースに保存
  try {
    const { error } = await supabase
      .from('patients')
      .update({ alert_notes: JSON.stringify(notes) })
      .eq('id', patientId)

    if (error) {
      console.error('Error updating patient alert notes:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating patient alert notes:', error)
    return false
  }
}

// 今日の確認履歴をチェック
export async function checkTodayConfirmation(patientId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // モックモード: ローカルストレージから取得
  if (MOCK_MODE) {
    try {
      const stored = localStorage.getItem(`patient_alert_confirmation_${patientId}`)
      if (stored) {
        return stored === today
      }
      return false
    } catch (error) {
      console.error('Error checking today confirmation from localStorage:', error)
      return false
    }
  }

  // 通常モード: データベースから取得
  try {
    const { data, error } = await supabase
      .from('patient_alert_confirmations')
      .select('id')
      .eq('patient_id', patientId)
      .eq('confirmed_date', today)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (期待される動作)
      console.error('Error checking today confirmation:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking today confirmation:', error)
    return false
  }
}

// 今日の確認を記録
export async function recordTodayConfirmation(patientId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // モックモード: ローカルストレージに保存
  if (MOCK_MODE) {
    try {
      localStorage.setItem(`patient_alert_confirmation_${patientId}`, today)
      return true
    } catch (error) {
      console.error('Error recording today confirmation in localStorage:', error)
      return false
    }
  }

  // 通常モード: データベースに保存
  try {
    const { error } = await supabase
      .from('patient_alert_confirmations')
      .insert({
        patient_id: patientId,
        confirmed_date: today,
      })

    if (error) {
      // UNIQUE制約違反（既に記録済み）は無視
      if (error.code === '23505') {
        return true
      }
      console.error('Error recording today confirmation:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error recording today confirmation:', error)
    return false
  }
}
