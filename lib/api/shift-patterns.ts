import { ShiftPattern, ShiftPatternInsert, ShiftPatternUpdate } from '@/types/database'

// 勤務時間パターンの取得
export async function getShiftPatterns(clinicId: string): Promise<ShiftPattern[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/shift-patterns?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'シフトパターンの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('シフトパターン取得エラー:', error)
    throw error
  }
}

// 勤務時間パターンの作成
export async function createShiftPattern(clinicId: string, pattern: ShiftPatternInsert): Promise<ShiftPattern> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/shift-patterns?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pattern)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'シフトパターンの作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('シフトパターン作成エラー:', error)
    throw error
  }
}

// 勤務時間パターンの更新
export async function updateShiftPattern(clinicId: string, patternId: string, updates: ShiftPatternUpdate): Promise<ShiftPattern> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/shift-patterns/${patternId}?clinic_id=${clinicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'シフトパターンの更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('シフトパターン更新エラー:', error)
    throw error
  }
}

// 勤務時間パターンの削除
export async function deleteShiftPattern(clinicId: string, patternId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/shift-patterns/${patternId}?clinic_id=${clinicId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'シフトパターンの削除に失敗しました')
    }
  } catch (error) {
    console.error('シフトパターン削除エラー:', error)
    throw error
  }
}
