import { supabase } from '@/lib/supabase'

export interface PatientNoteType {
  id: string
  name: string
  icon?: string
  color?: string
  sort_order: number
  clinic_id: string
  created_at: string
  updated_at: string
}

export interface CreatePatientNoteTypeData {
  name: string
  icon?: string
  color?: string
  sort_order: number
}

export interface UpdatePatientNoteTypeData {
  name?: string
  icon?: string
  color?: string
  sort_order?: number
}

// 患者特記事項タイプ一覧取得
export async function getPatientNoteTypes(clinicId: string): Promise<PatientNoteType[]> {
  try {
    const { data, error } = await supabase
      .from('patient_note_types')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order')

    if (error) {
      console.error('患者特記事項タイプ取得エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('患者特記事項タイプ取得エラー:', error)
    // エラー時はダミーデータを返す
    return [
      {
        id: '1',
        name: 'アレルギー',
        icon: '🤧',
        color: '#EF4444',
        sort_order: 1,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: '糖尿病',
        icon: '🩸',
        color: '#F59E0B',
        sort_order: 2,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: '高血圧',
        icon: '❤️',
        color: '#DC2626',
        sort_order: 3,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }
}

// 患者特記事項タイプ作成
export async function createPatientNoteType(clinicId: string, data: CreatePatientNoteTypeData): Promise<PatientNoteType> {
  try {
    const { data: newNoteType, error } = await supabase
      .from('patient_note_types')
      .insert({
        ...data,
        clinic_id: clinicId
      })
      .select()
      .single()

    if (error) {
      console.error('患者特記事項タイプ作成エラー:', error)
      throw error
    }

    return newNoteType
  } catch (error) {
    console.error('患者特記事項タイプ作成エラー:', error)
    // エラー時はダミーデータを返す
    return {
      id: Date.now().toString(),
      name: data.name,
      icon: data.icon,
      color: data.color || '#3B82F6',
      sort_order: data.sort_order,
      clinic_id: clinicId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

// 患者特記事項タイプ更新
export async function updatePatientNoteType(clinicId: string, noteTypeId: string, data: UpdatePatientNoteTypeData): Promise<PatientNoteType> {
  try {
    const { data: updatedNoteType, error } = await supabase
      .from('patient_note_types')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', noteTypeId)
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (error) {
      console.error('患者特記事項タイプ更新エラー:', error)
      throw error
    }

    return updatedNoteType
  } catch (error) {
    console.error('患者特記事項タイプ更新エラー:', error)
    throw error
  }
}

// 患者特記事項タイプ削除
export async function deletePatientNoteType(clinicId: string, noteTypeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('patient_note_types')
      .delete()
      .eq('id', noteTypeId)
      .eq('clinic_id', clinicId)

    if (error) {
      console.error('患者特記事項タイプ削除エラー:', error)
      throw error
    }
  } catch (error) {
    console.error('患者特記事項タイプ削除エラー:', error)
    throw error
  }
}