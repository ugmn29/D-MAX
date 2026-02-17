// Migrated to Prisma API Routes

export interface PatientNoteType {
  id: string
  clinic_id: string
  name: string
  icon?: string
  color?: string
  sort_order: number
  created_at: string
}

export interface PatientNoteTypeInsert {
  clinic_id: string
  name: string
  icon?: string
  color?: string
  sort_order: number
}

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

// デフォルトの患者ノートタイプを返す
function getDefaultPatientNoteTypes(clinicId: string): PatientNoteType[] {
  return [
    {
      id: 'default-1',
      clinic_id: clinicId,
      name: 'アレルギー',
      sort_order: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 'default-2',
      clinic_id: clinicId,
      name: '既往歴',
      sort_order: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 'default-3',
      clinic_id: clinicId,
      name: '服用薬',
      sort_order: 3,
      created_at: new Date().toISOString()
    },
    {
      id: 'default-4',
      clinic_id: clinicId,
      name: '注意事項',
      sort_order: 4,
      created_at: new Date().toISOString()
    }
  ]
}

export async function getPatientNoteTypes(clinicId: string): Promise<PatientNoteType[]> {
  try {
    const response = await fetch(`${baseUrl}/api/patient-note-types?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('患者ノートタイプ取得エラー:', errorData)
      // テーブルが存在しない場合やエラーの場合はデフォルトデータを返す
      return getDefaultPatientNoteTypes(clinicId)
    }

    return await response.json()
  } catch (error) {
    console.error('患者ノートタイプ取得で予期しないエラー:', error)
    // エラーが発生した場合はデフォルトデータを返す
    return getDefaultPatientNoteTypes(clinicId)
  }
}

export async function createPatientNoteType(
  clinicId: string,
  noteTypeData: Omit<PatientNoteTypeInsert, 'clinic_id'>
): Promise<PatientNoteType> {
  try {
    const response = await fetch(`${baseUrl}/api/patient-note-types?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(noteTypeData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者ノートタイプの作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('患者ノートタイプ作成エラー:', error)
    throw error
  }
}

export async function updatePatientNoteType(
  clinicId: string,
  noteTypeId: string,
  updates: Partial<Omit<PatientNoteTypeInsert, 'clinic_id'>>
): Promise<PatientNoteType> {
  try {
    const response = await fetch(`${baseUrl}/api/patient-note-types/${noteTypeId}?clinic_id=${clinicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者ノートタイプの更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('患者ノートタイプ更新エラー:', error)
    throw error
  }
}

export async function deletePatientNoteType(
  clinicId: string,
  noteTypeId: string
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/patient-note-types/${noteTypeId}?clinic_id=${clinicId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者ノートタイプの削除に失敗しました')
    }
  } catch (error) {
    console.error('患者ノートタイプ削除エラー:', error)
    throw error
  }
}
