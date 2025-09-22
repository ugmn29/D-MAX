import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { initializeDatabase } from '@/lib/utils/database-setup'
import { MOCK_MODE, getMockPatientNoteTypes, addMockPatientNoteType, removeMockPatientNoteType } from '@/lib/utils/mock-mode'

export interface PatientNoteType {
  id: string
  clinic_id: string
  name: string
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PatientNoteTypeInsert {
  clinic_id: string
  name: string
  description?: string
  sort_order: number
  is_active?: boolean
}

export async function getPatientNoteTypes(clinicId: string): Promise<PatientNoteType[]> {
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: 患者ノートタイプデータを返します')
    return getMockPatientNoteTypes().filter(item => item.clinic_id === clinicId)
  }

  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('patient_note_types')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('患者ノートタイプ取得エラー:', error)
      // テーブルが存在しない場合はデフォルトデータを返す
      if (error.code === 'PGRST116' || error.message?.includes('relation "patient_note_types" does not exist')) {
        console.warn('patient_note_typesテーブルが存在しません。デフォルトデータを返します。')
        return getDefaultPatientNoteTypes(clinicId)
      }
      throw new Error(`患者ノートタイプの取得に失敗しました: ${error.message}`)
    }

    return data || []
  } catch (err) {
    console.error('患者ノートタイプ取得で予期しないエラー:', err)
    // エラーが発生した場合はデフォルトデータを返す
    return getDefaultPatientNoteTypes(clinicId)
  }
}

// デフォルトの患者ノートタイプを返す
function getDefaultPatientNoteTypes(clinicId: string): PatientNoteType[] {
  return [
    {
      id: 'default-1',
      clinic_id: clinicId,
      name: 'アレルギー',
      description: '患者のアレルギー情報',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'default-2',
      clinic_id: clinicId,
      name: '既往歴',
      description: '過去の病気や治療歴',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'default-3',
      clinic_id: clinicId,
      name: '服用薬',
      description: '現在服用中の薬',
      sort_order: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'default-4',
      clinic_id: clinicId,
      name: '注意事項',
      description: 'その他の注意事項',
      sort_order: 4,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
}

export async function createPatientNoteType(
  clinicId: string,
  noteTypeData: Omit<PatientNoteTypeInsert, 'clinic_id'>
): Promise<PatientNoteType> {
  try {
    const newNoteType = {
      clinic_id: clinicId,
      name: noteTypeData.name,
      description: noteTypeData.description || '',
      sort_order: noteTypeData.sort_order || 0,
      is_active: noteTypeData.is_active ?? true
    }

    const client = getSupabaseClient()
    const { data, error } = await client
      .from('patient_note_types')
      .insert(newNoteType)
      .select()
      .single()

    if (error) {
      console.error('患者ノートタイプ作成エラー:', error)
      if (error.code === 'PGRST116' || error.message?.includes('relation "patient_note_types" does not exist')) {
        throw new Error('patient_note_typesテーブルが存在しません。データベースのセットアップを確認してください。')
      }
      throw new Error(`患者ノートタイプの作成に失敗しました: ${error.message}`)
    }

    return data
  } catch (err) {
    console.error('患者ノートタイプ作成で予期しないエラー:', err)
    throw err
  }
}

export async function updatePatientNoteType(
  clinicId: string,
  noteTypeId: string,
  updates: Partial<Omit<PatientNoteTypeInsert, 'clinic_id'>>
): Promise<PatientNoteType> {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('patient_note_types')
      .update(updates)
      .eq('id', noteTypeId)
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (error) {
      console.error('患者ノートタイプ更新エラー:', error)
      if (error.code === 'PGRST116' || error.message?.includes('relation "patient_note_types" does not exist')) {
        throw new Error('patient_note_typesテーブルが存在しません。データベースのセットアップを確認してください。')
      }
      throw new Error(`患者ノートタイプの更新に失敗しました: ${error.message}`)
    }

    return data
  } catch (err) {
    console.error('患者ノートタイプ更新で予期しないエラー:', err)
    throw err
  }
}

export async function deletePatientNoteType(
  clinicId: string,
  noteTypeId: string
): Promise<void> {
  try {
    const client = getSupabaseClient()
    const { error } = await client
      .from('patient_note_types')
      .delete()
      .eq('id', noteTypeId)
      .eq('clinic_id', clinicId)

    if (error) {
      console.error('患者ノートタイプ削除エラー:', error)
      if (error.code === 'PGRST116' || error.message?.includes('relation "patient_note_types" does not exist')) {
        throw new Error('patient_note_typesテーブルが存在しません。データベースのセットアップを確認してください。')
      }
      throw new Error(`患者ノートタイプの削除に失敗しました: ${error.message}`)
    }
  } catch (err) {
    console.error('患者ノートタイプ削除で予期しないエラー:', err)
    throw err
  }
}
