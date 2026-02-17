// Migrated to Prisma API Routes
import { StaffShift, StaffShiftInsert, StaffShiftUpdate } from '@/types/database'
import { MOCK_MODE, getMockStaffShifts, addMockStaffShift, removeMockStaffShift, getMockStaff, getMockStaffPositions, getMockShiftPatterns } from '@/lib/utils/mock-mode'

// シフトデータの取得（月単位）
export async function getStaffShifts(clinicId: string, year: number, month: number): Promise<StaffShift[]> {
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: シフトデータを返します', { clinicId, year, month })
    return getMockStaffShifts().filter(item => item.clinic_id === clinicId)
  }

  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff-shifts?clinic_id=${clinicId}&year=${year}&month=${month}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('シフトデータ取得エラー (API):', errorData)
      throw new Error(errorData.error || 'シフトデータ取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('シフトデータ取得エラー:', error)
    throw error
  }
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

  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff-shifts?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shift)
    })

    console.log('upsertStaffShiftレスポンス:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('シフトデータ作成・更新エラー (API):', errorData)
      console.error('エラーの詳細:', errorData)
      throw new Error(errorData.error || 'シフトデータの作成・更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('シフトデータ作成・更新エラー:', error)
    throw error
  }
}

// シフトデータの削除
export async function deleteStaffShift(clinicId: string, shiftId: string): Promise<void> {
  // モックモードの場合はモックデータから削除
  if (MOCK_MODE) {
    console.log('モックモード: シフトデータを削除します', { clinicId, shiftId })
    removeMockStaffShift(shiftId)
    return
  }

  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff-shifts?clinic_id=${clinicId}&shift_id=${shiftId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('シフトデータ削除エラー (API):', errorData)
      throw new Error(errorData.error || 'シフトデータの削除に失敗しました')
    }
  } catch (error) {
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

  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff-shifts?clinic_id=${clinicId}&date=${date}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('日付別シフトデータ取得エラー (API):', errorData)
      throw new Error(errorData.error || '日付別シフトデータ取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('日付別シフトデータ取得エラー:', error)
    throw error
  }
}