// Migrated to Prisma API Routes

export interface Unit {
  id: string
  clinic_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface StaffUnitPriority {
  id: string
  clinic_id: string
  staff_id: string
  unit_id: string
  priority_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  staff?: {
    id: string
    name: string
  }
  unit?: {
    id: string
    name: string
  }
}

export interface CreateUnitData {
  name: string
  sort_order?: number
  is_active?: boolean
}

export interface UpdateUnitData {
  name?: string
  sort_order?: number
  is_active?: boolean
}

export interface CreateStaffUnitPriorityData {
  staff_id: string
  unit_id: string
  priority_order: number
  is_active?: boolean
}

export interface UpdateStaffUnitPriorityData {
  priority_order?: number
  is_active?: boolean
}

// ユニット一覧取得
export async function getUnits(clinicId: string): Promise<Unit[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/units?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'ユニットの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('ユニット取得エラー:', error)
    return []
  }
}

// ユニット作成
export async function createUnit(clinicId: string, data: CreateUnitData): Promise<Unit> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/units?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'ユニットの作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('ユニット作成エラー:', error)
    throw error
  }
}

// ユニット更新
export async function updateUnit(clinicId: string, unitId: string, data: UpdateUnitData): Promise<Unit> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/units/${unitId}?clinic_id=${clinicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'ユニットの更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('ユニット更新エラー:', error)
    throw error
  }
}

// ユニット削除（既存予約がある場合はエラー）
export async function deleteUnit(clinicId: string, unitId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/units/${unitId}?clinic_id=${clinicId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'ユニットの削除に失敗しました')
    }
  } catch (error) {
    console.error('ユニット削除エラー:', error)
    throw error
  }
}

// スタッフユニット優先順位一覧取得
export async function getStaffUnitPriorities(clinicId: string, staffId?: string): Promise<StaffUnitPriority[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({ clinic_id: clinicId })
    if (staffId) {
      params.append('staff_id', staffId)
    }

    const response = await fetch(`${baseUrl}/api/staff-unit-priorities?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.warn('スタッフユニット優先順位の取得に失敗しました。空配列を返します。')
      return []
    }

    return await response.json()
  } catch (error) {
    console.warn('スタッフユニット優先順位の取得中にエラーが発生しました。空配列を返します。')
    return []
  }
}

// スタッフユニット優先順位作成
export async function createStaffUnitPriority(clinicId: string, data: CreateStaffUnitPriorityData): Promise<StaffUnitPriority> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/staff-unit-priorities?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'スタッフユニット優先順位の作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフユニット優先順位作成エラー:', error)
    throw error instanceof Error ? error : new Error('スタッフユニット優先順位の作成に失敗しました')
  }
}

// スタッフユニット優先順位更新
export async function updateStaffUnitPriority(clinicId: string, priorityId: string, data: { priority_order?: number; is_active?: boolean }): Promise<StaffUnitPriority> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/staff-unit-priorities/${priorityId}?clinic_id=${clinicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'スタッフユニット優先順位の更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフユニット優先順位更新エラー:', error)
    throw error instanceof Error ? error : new Error('スタッフユニット優先順位の更新に失敗しました')
  }
}

// スタッフユニット優先順位削除
export async function deleteStaffUnitPriority(clinicId: string, priorityId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/staff-unit-priorities/${priorityId}?clinic_id=${clinicId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'スタッフユニット優先順位の削除に失敗しました')
    }
  } catch (error) {
    console.error('スタッフユニット優先順位削除エラー:', error)
    throw error instanceof Error ? error : new Error('スタッフユニット優先順位の削除に失敗しました')
  }
}

// スタッフのユニット優先順位を一括更新（ドラッグ&ドロップ用）
export async function updateStaffUnitPriorities(clinicId: string, staffId: string, priorities: { unitId: string; priorityOrder: number }[]): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/staff-unit-priorities/bulk?clinic_id=${clinicId}&staff_id=${staffId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ priorities })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'スタッフユニット優先順位の一括更新に失敗しました')
    }
  } catch (error) {
    console.error('スタッフユニット優先順位一括更新エラー:', error)
    throw error instanceof Error ? error : new Error('スタッフユニット優先順位の一括更新に失敗しました')
  }
}
