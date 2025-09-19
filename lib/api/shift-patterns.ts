import { supabase } from '@/lib/supabase'
import { ShiftPattern, ShiftPatternInsert, ShiftPatternUpdate } from '@/types/database'

// 勤務時間パターンの取得
export async function getShiftPatterns(clinicId: string): Promise<ShiftPattern[]> {
  console.log('getShiftPatterns呼び出し:', clinicId)
  
  const { data, error } = await supabase
    .from('shift_patterns')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('abbreviation')

  console.log('getShiftPatternsレスポンス:', { data, error })

  if (error) {
    console.error('勤務時間パターン取得エラー:', error)
    console.error('エラーの詳細:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw error
  }

  return data || []
}

// 勤務時間パターンの作成
export async function createShiftPattern(clinicId: string, pattern: ShiftPatternInsert): Promise<ShiftPattern> {
  console.log('createShiftPattern呼び出し:', { clinicId, pattern })
  
  const insertData = {
    ...pattern,
    clinic_id: clinicId
  }
  
  console.log('Supabaseに送信するデータ:', insertData)
  
  const { data, error } = await supabase
    .from('shift_patterns')
    .insert(insertData)
    .select()
    .single()

  console.log('Supabaseレスポンス:', { data, error })

  if (error) {
    console.error('勤務時間パターン作成エラー:', error)
    console.error('エラーの詳細:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw error
  }

  return data
}

// 勤務時間パターンの更新
export async function updateShiftPattern(clinicId: string, patternId: string, updates: ShiftPatternUpdate): Promise<ShiftPattern> {
  const { data, error } = await supabase
    .from('shift_patterns')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', patternId)
    .eq('clinic_id', clinicId)
    .select()
    .single()

  if (error) {
    console.error('勤務時間パターン更新エラー:', error)
    throw error
  }

  return data
}

// 勤務時間パターンの削除
export async function deleteShiftPattern(clinicId: string, patternId: string): Promise<void> {
  const { error } = await supabase
    .from('shift_patterns')
    .delete()
    .eq('id', patternId)
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('勤務時間パターン削除エラー:', error)
    throw error
  }
}
