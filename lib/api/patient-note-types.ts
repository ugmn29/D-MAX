import { supabase } from '@/lib/supabase'

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
  const { data, error } = await supabase
    .from('patient_note_types')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('患者ノートタイプ取得エラー:', error)
    throw new Error('患者ノートタイプの取得に失敗しました')
  }

  return data || []
}

export async function createPatientNoteType(
  clinicId: string,
  noteTypeData: Omit<PatientNoteTypeInsert, 'clinic_id'>
): Promise<PatientNoteType> {
  const newNoteType = {
    clinic_id: clinicId,
    name: noteTypeData.name,
    description: noteTypeData.description || '',
    sort_order: noteTypeData.sort_order || 0,
    is_active: noteTypeData.is_active ?? true
  }

  const { data, error } = await supabase
    .from('patient_note_types')
    .insert(newNoteType)
    .select()
    .single()

  if (error) {
    console.error('患者ノートタイプ作成エラー:', error)
    throw new Error(`患者ノートタイプの作成に失敗しました: ${error.message}`)
  }

  return data
}

export async function updatePatientNoteType(
  clinicId: string,
  noteTypeId: string,
  updates: Partial<Omit<PatientNoteTypeInsert, 'clinic_id'>>
): Promise<PatientNoteType> {
  const { data, error } = await supabase
    .from('patient_note_types')
    .update(updates)
    .eq('id', noteTypeId)
    .eq('clinic_id', clinicId)
    .select()
    .single()

  if (error) {
    console.error('患者ノートタイプ更新エラー:', error)
    throw new Error('患者ノートタイプの更新に失敗しました')
  }

  return data
}

export async function deletePatientNoteType(
  clinicId: string,
  noteTypeId: string
): Promise<void> {
  const { error } = await supabase
    .from('patient_note_types')
    .delete()
    .eq('id', noteTypeId)
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('患者ノートタイプ削除エラー:', error)
    throw new Error('患者ノートタイプの削除に失敗しました')
  }
}
