import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { ShiftPattern, ShiftPatternInsert, ShiftPatternUpdate } from '@/types/database'
import { MOCK_MODE, getMockShiftPatterns, addMockShiftPattern, updateMockShiftPattern, removeMockShiftPattern } from '@/lib/utils/mock-mode'

// 勤務時間パターンの取得
export async function getShiftPatterns(clinicId: string): Promise<ShiftPattern[]> {
  console.log('getShiftPatterns呼び出し:', clinicId)
  
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: 勤務時間パターンデータを返します')
    return getMockShiftPatterns().filter(item => item.clinic_id === clinicId)
  }
  
  const client = getSupabaseClient()
  const { data, error } = await client
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
  
  // モックモードの場合はモックデータを生成して返す
  if (MOCK_MODE) {
    console.log('モックモード: 勤務時間パターンを作成します', { clinicId, pattern })
    const newPattern: ShiftPattern = {
      id: `mock-pattern-${Date.now()}`,
      clinic_id: clinicId,
      abbreviation: pattern.abbreviation,
      name: pattern.name,
      start_time: pattern.start_time,
      end_time: pattern.end_time,
      break_start: pattern.break_start,
      break_end: pattern.break_end,
      memo: pattern.memo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    addMockShiftPattern(newPattern)
    return newPattern
  }
  
  const insertData = {
    ...pattern,
    clinic_id: clinicId
  }
  
  console.log('Supabaseに送信するデータ:', insertData)
  
  const client = getSupabaseClient()
  const { data, error } = await client
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
  // モックモードの場合はモックデータを更新
  if (MOCK_MODE) {
    console.log('モックモード: 勤務時間パターンを更新します', { clinicId, patternId, updates })
    updateMockShiftPattern(patternId, updates)
    const data = getMockShiftPatterns().find(item => item.id === patternId)
    if (!data) {
      throw new Error('勤務時間パターンが見つかりません')
    }
    return data
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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
  // モックモードの場合はモックデータから削除
  if (MOCK_MODE) {
    console.log('モックモード: 勤務時間パターンを削除します', { clinicId, patternId })
    removeMockShiftPattern(patternId)
    return
  }

  const client = getSupabaseClient()
  const { error } = await client
    .from('shift_patterns')
    .delete()
    .eq('id', patternId)
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('勤務時間パターン削除エラー:', error)
    throw error
  }
}
