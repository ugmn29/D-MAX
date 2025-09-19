import { supabase } from '@/lib/supabase'
import { StaffShift, StaffShiftInsert, StaffShiftUpdate } from '@/types/database'

// シフトデータの取得（月単位）
export async function getStaffShifts(clinicId: string, year: number, month: number): Promise<StaffShift[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  // 月末日を正しく計算
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  
  const { data, error } = await supabase
    .from('staff_shifts')
    .select(`
      *,
      shift_patterns (
        abbreviation,
        name,
        start_time,
        end_time,
        break_start,
        break_end
      )
    `)
    .eq('clinic_id', clinicId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  if (error) {
    console.error('シフトデータ取得エラー:', error)
    throw error
  }

  return data || []
}

// シフトデータの作成・更新
export async function upsertStaffShift(clinicId: string, shift: StaffShiftInsert): Promise<StaffShift> {
  console.log('upsertStaffShift呼び出し:', { clinicId, shift })
  
  const upsertData = {
    ...shift,
    clinic_id: clinicId,
    shift_pattern_id: shift.shift_pattern_id === 'none' ? null : shift.shift_pattern_id, // "none"の場合はnullに変換
    updated_at: new Date().toISOString()
  }
  
  console.log('Supabaseに送信するデータ:', upsertData)
  
  const { data, error } = await supabase
    .from('staff_shifts')
    .upsert(upsertData, { onConflict: 'clinic_id,staff_id,date' })
    .select()
    .single()

  console.log('upsertStaffShiftレスポンス:', { data, error })

  if (error) {
    console.error('シフトデータ作成・更新エラー:', error)
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

// シフトデータの削除
export async function deleteStaffShift(clinicId: string, shiftId: string): Promise<void> {
  const { error } = await supabase
    .from('staff_shifts')
    .delete()
    .eq('id', shiftId)
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('シフトデータ削除エラー:', error)
    throw error
  }
}

// 日付単位でのシフトデータ取得
export async function getStaffShiftsByDate(clinicId: string, date: string): Promise<StaffShift[]> {
  const { data, error } = await supabase
    .from('staff_shifts')
    .select(`
      *,
      shift_patterns (
        abbreviation,
        name,
        start_time,
        end_time,
        break_start,
        break_end
      )
    `)
    .eq('clinic_id', clinicId)
    .eq('date', date)

  if (error) {
    console.error('日付別シフトデータ取得エラー:', error)
    throw error
  }

  return data || []
}