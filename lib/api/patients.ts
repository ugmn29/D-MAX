// Migrated to Prisma API Routes
import { Patient, PatientInsert, PatientUpdate } from '@/types/database'

// 患者API関数

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * 全患者を取得
 */
export async function getPatients(clinicId: string): Promise<Patient[]> {
  try {
    const response = await fetch(`${baseUrl}/api/patients?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者データの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('患者取得エラー:', error)
    throw error
  }
}

/**
 * 患者を検索
 */
export async function searchPatients(
  clinicId: string,
  searchQuery: string
): Promise<Patient[]> {
  try {
    const params = new URLSearchParams({
      clinic_id: clinicId,
      query: searchQuery
    })

    const response = await fetch(`${baseUrl}/api/patients/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者の検索に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('患者検索エラー:', error)
    throw error
  }
}

/**
 * 患者詳細を取得
 */
export async function getPatientById(
  clinicId: string,
  patientId: string
): Promise<Patient | null> {
  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者情報の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('患者詳細取得エラー:', error)
    throw error
  }
}

/**
 * 新しい患者番号を生成（欠番を優先的に再利用）
 */
export async function generatePatientNumber(clinicId: string): Promise<number> {
  try {
    const response = await fetch(`${baseUrl}/api/patients/generate-number?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者番号の生成に失敗しました')
    }

    const data = await response.json()
    return data.patient_number
  } catch (error) {
    console.error('患者番号生成エラー:', error)
    throw error
  }
}

/**
 * 患者を新規作成
 */
export async function createPatient(
  clinicId: string,
  patientData: Omit<PatientInsert, 'clinic_id' | 'patient_number'>
): Promise<Patient> {
  try {
    const response = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clinic_id: clinicId, ...patientData })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者の作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('患者作成エラー:', error)
    throw error
  }
}

/**
 * 患者情報を更新
 */
export async function updatePatient(
  clinicId: string,
  patientId: string,
  patientData: PatientUpdate
): Promise<Patient> {
  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clinic_id: clinicId, ...patientData })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者情報の更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('患者更新エラー:', error)
    throw error
  }
}

/**
 * 患者を削除（論理削除）
 */
export async function deletePatient(
  clinicId: string,
  patientId: string
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}?clinic_id=${clinicId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者の削除に失敗しました')
    }
  } catch (error) {
    console.error('患者削除エラー:', error)
    throw error
  }
}

/**
 * 統計情報を取得
 */
export async function getPatientsStats(clinicId: string) {
  try {
    const response = await fetch(`${baseUrl}/api/patients/stats?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '統計情報の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('統計取得エラー:', error)
    throw error
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
  try {
    const response = await fetch(`${baseUrl}/api/patients/link-status?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '連携状況の取得に失敗しました')
    }

    return await response.json()
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
  try {
    const response = await fetch(`${baseUrl}/api/patients/link-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ patientId })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者連携に失敗しました')
    }

    console.log('患者連携完了:', patientId)
  } catch (error) {
    console.error('患者連携エラー:', error)
    throw error
  }
}

/**
 * 患者を仮登録に戻す（連携解除）
 * 元の患者データを復元してから連携を解除
 */
export async function unlinkPatientFromQuestionnaire(patientId: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/patients/link-status?patientId=${patientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者連携解除に失敗しました')
    }

    console.log('患者連携解除完了:', patientId)
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
  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}/contact-method`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.preferred_contact_method
  } catch (error) {
    console.error('連絡手段取得エラー:', error)
    return null
  }
}

/**
 * 患者の希望連絡手段を更新
 */
export async function updatePatientContactMethod(
  patientId: string,
  contactMethod: 'line' | 'email' | 'sms'
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}/contact-method`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contact_method: contactMethod })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '連絡手段の更新に失敗しました')
    }
  } catch (error) {
    console.error('連絡手段更新エラー:', error)
    throw error
  }
}

/**
 * 患者の通知設定を取得
 */
export async function getPatientNotificationPreferences(
  patientId: string
): Promise<Record<string, boolean>> {
  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}/notification-preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return {
        appointment_reminder: true,
        treatment_reminder: true,
        periodic_checkup: true,
        other: true
      }
    }

    return await response.json()
  } catch (error) {
    console.error('通知設定取得エラー:', error)
    return {
      appointment_reminder: true,
      treatment_reminder: true,
      periodic_checkup: true,
      other: true
    }
  }
}

/**
 * 患者の通知設定を更新
 */
export async function updatePatientNotificationPreferences(
  patientId: string,
  preferences: Record<string, boolean>
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}/notification-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '通知設定の更新に失敗しました')
    }
  } catch (error) {
    console.error('通知設定更新エラー:', error)
    throw error
  }
}

/**
 * 患者の自動リマインド設定を取得
 */
export async function getPatientAutoReminderSettings(
  patientId: string
): Promise<{ enabled: boolean; custom_intervals: any }> {
  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}/auto-reminder`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return {
        enabled: true,
        custom_intervals: null
      }
    }

    return await response.json()
  } catch (error) {
    console.error('自動リマインド設定取得エラー:', error)
    return {
      enabled: true,
      custom_intervals: null
    }
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
  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}/auto-reminder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled, custom_intervals: customIntervals })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '自動リマインド設定の更新に失敗しました')
    }
  } catch (error) {
    console.error('自動リマインド設定更新エラー:', error)
    throw error
  }
}

/**
 * 患者の治療計画メモを取得
 */
export async function getPatientTreatmentMemo(
  clinicId: string,
  patientId: string
): Promise<string | null> {
  // UUID形式でない場合はスキップ（ローカルストレージの仮IDの場合）
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(patientId)) {
    return null
  }

  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}/treatment-memo?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.treatment_memo
  } catch (error) {
    console.error('治療計画メモ取得エラー:', error)
    return null
  }
}

/**
 * 患者の治療計画メモを更新
 */
export async function updatePatientTreatmentMemo(
  clinicId: string,
  patientId: string,
  memo: string | null
): Promise<void> {
  // UUID形式でない場合はスキップ（ローカルストレージの仮IDの場合）
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(patientId)) {
    return
  }

  try {
    const response = await fetch(`${baseUrl}/api/patients/${patientId}/treatment-memo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clinic_id: clinicId, memo })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '治療計画メモの保存に失敗しました')
    }
  } catch (error) {
    console.error('治療計画メモ更新エラー:', error)
    throw error
  }
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
  try {
    // 少なくとも1つの識別子が必要
    if (!authData.patientNumber && !authData.phone && !authData.email) {
      return null
    }

    const response = await fetch(`${baseUrl}/api/patients/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clinic_id: clinicId,
        patient_number: authData.patientNumber,
        phone: authData.phone,
        email: authData.email,
        birthdate: authData.birthdate
      })
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('患者認証処理エラー:', error)
    return null
  }
}
