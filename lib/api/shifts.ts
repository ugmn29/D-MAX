import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { StaffShift, StaffShiftInsert, StaffShiftUpdate } from '@/types/database'
import { MOCK_MODE, getMockStaffShifts, addMockStaffShift, removeMockStaffShift, getMockStaff, getMockStaffPositions, getMockShiftPatterns } from '@/lib/utils/mock-mode'

// シフトデータの取得（月単位）
export async function getStaffShifts(clinicId: string, year: number, month: number): Promise<StaffShift[]> {
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: シフトデータを返します', { clinicId, year, month })
    return getMockStaffShifts().filter(item => item.clinic_id === clinicId)
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  // 月末日を正しく計算
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  
  const client = getSupabaseClient()
  const { data, error } = await client
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
  
  // モックモードの場合はモックデータを生成して返す
  if (MOCK_MODE) {
    console.log('モックモード: シフトデータを作成・更新します', { clinicId, shift })
    
    // スタッフ情報とシフトパターン情報を取得
    const staffData = getMockStaff().find(s => s.id === shift.staff_id)
    const positions = getMockStaffPositions()
    const patterns = getMockShiftPatterns()
    
    console.log('シフト保存時のデバッグ:', {
      staff_id: shift.staff_id,
      staffData,
      positions: positions.length,
      patterns: patterns.length
    })
    
    const staffPosition = positions.find(p => p.id === staffData?.position_id)
    const shiftPattern = patterns.find(p => p.id === shift.shift_pattern_id)
    
    const newShift: StaffShift = {
      id: `mock-shift-${Date.now()}`,
      clinic_id: clinicId,
      staff_id: shift.staff_id,
      date: shift.date,
      shift_pattern_id: shift.shift_pattern_id === 'none' ? null : shift.shift_pattern_id,
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_start: shift.break_start,
      break_end: shift.break_end,
      memo: shift.memo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // 関連データを含める
      staff: staffData ? {
        id: staffData.id,
        name: staffData.name,
        name_kana: staffData.name_kana,
        position_id: staffData.position_id,
        role: staffData.role,
        is_active: staffData.is_active,
        position: staffPosition ? {
          id: staffPosition.id,
          name: staffPosition.name,
          sort_order: staffPosition.sort_order
        } : null
      } : null,
      shift_patterns: shiftPattern ? {
        abbreviation: shiftPattern.abbreviation,
        name: shiftPattern.name,
        start_time: shiftPattern.start_time,
        end_time: shiftPattern.end_time,
        break_start: shiftPattern.break_start,
        break_end: shiftPattern.break_end
      } : null
    }
    addMockStaffShift(newShift)
    return newShift
  }
  
  const upsertData = {
    ...shift,
    clinic_id: clinicId,
    shift_pattern_id: shift.shift_pattern_id === 'none' ? null : shift.shift_pattern_id, // "none"の場合はnullに変換
    updated_at: new Date().toISOString()
  }
  
  console.log('Supabaseに送信するデータ:', upsertData)
  
  const client = getSupabaseClient()
  const { data, error } = await client
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
  // モックモードの場合はモックデータから削除
  if (MOCK_MODE) {
    console.log('モックモード: シフトデータを削除します', { clinicId, shiftId })
    removeMockStaffShift(shiftId)
    return
  }

  const client = getSupabaseClient()
  const { error } = await client
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
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: 日付単位シフトデータを返します', { clinicId, date })
    const shifts = getMockStaffShifts().filter(item => item.clinic_id === clinicId && item.date === date)
    
    // スタッフ情報とシフトパターン情報を含める
    const staffData = getMockStaff()
    const positions = getMockStaffPositions()
    const patterns = getMockShiftPatterns()
    
    return shifts.map(shift => {
      const staff = staffData.find(s => s.id === shift.staff_id)
      const position = positions.find(p => p.id === staff?.position_id)
      const pattern = patterns.find(p => p.id === shift.shift_pattern_id)
      
      return {
        ...shift,
        staff: staff ? {
          id: staff.id,
          name: staff.name,
          name_kana: staff.name_kana,
          position_id: staff.position_id,
          role: staff.role,
          is_active: staff.is_active,
          position: position ? {
            id: position.id,
            name: position.name,
            sort_order: position.sort_order
          } : null
        } : null,
        shift_patterns: pattern ? {
          abbreviation: pattern.abbreviation,
          name: pattern.name,
          start_time: pattern.start_time,
          end_time: pattern.end_time,
          break_start: pattern.break_start,
          break_end: pattern.break_end
        } : null
      }
    })
  }

  const client = getSupabaseClient()

  console.log('shifts.ts: データベースクエリ実行:', { clinicId, date })

  const { data, error } = await client
    .from('staff_shifts')
    .select(`
      *,
      staff:staff_id (
        id,
        name,
        name_kana,
        position_id,
        role,
        is_active,
        position:staff_positions (
          id,
          name,
          sort_order
        )
      ),
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

  console.log('shifts.ts: データベースレスポンス:', {
    dataCount: data?.length || 0,
    data,
    error
  })

  if (error) {
    console.error('日付別シフトデータ取得エラー:', error)
    throw error
  }

  return data || []
}