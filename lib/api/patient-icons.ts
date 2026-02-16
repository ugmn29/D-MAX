// Migrated to Prisma API Routes

export interface PatientIcons {
  id: string
  patient_id: string
  clinic_id: string
  icon_ids: string[]
  created_at: string
  updated_at: string
}

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * 患者の特記事項アイコンを取得
 */
export async function getPatientIcons(
  patientId: string,
  clinicId: string
): Promise<PatientIcons | null> {
  try {
    const params = new URLSearchParams({
      patient_id: patientId,
      clinic_id: clinicId
    })

    const response = await fetch(`${baseUrl}/api/patient-icons?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 404) {
      // レコードが存在しない場合はnullを返す
      return null
    }

    if (!response.ok) {
      console.warn('患者アイコンの取得時に予期しないエラーが発生しました')
      return null
    }

    return await response.json()
  } catch (error) {
    console.warn('患者アイコンの取得時にエラーが発生しました:', error)
    return null
  }
}

/**
 * 患者の特記事項アイコンを保存（upsert）
 */
export async function upsertPatientIcons(
  patientId: string,
  clinicId: string,
  iconIds: string[]
): Promise<PatientIcons> {
  try {
    const response = await fetch(`${baseUrl}/api/patient-icons`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient_id: patientId,
        clinic_id: clinicId,
        icon_ids: iconIds
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者アイコンの保存に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('患者アイコンの保存エラー:', error)
    throw error
  }
}

/**
 * 患者の特記事項アイコンを削除
 */
export async function deletePatientIcons(
  patientId: string,
  clinicId: string
): Promise<void> {
  try {
    const params = new URLSearchParams({
      patient_id: patientId,
      clinic_id: clinicId
    })

    const response = await fetch(`${baseUrl}/api/patient-icons?${params.toString()}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者アイコンの削除に失敗しました')
    }
  } catch (error) {
    console.error('患者アイコンの削除エラー:', error)
    throw error
  }
}
