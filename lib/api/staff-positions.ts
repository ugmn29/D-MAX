export interface StaffPosition {
  id: string
  clinic_id: string
  name: string
  sort_order: number
  enabled?: boolean
  created_at: string
  updated_at: string
}

export interface StaffPositionInsert {
  clinic_id: string
  name: string
  sort_order: number
  enabled?: boolean
}

export async function getStaffPositions(clinicId: string): Promise<StaffPosition[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/staff-positions?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'スタッフ役職の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ役職取得エラー:', error)
    throw error
  }
}

export async function createStaffPosition(
  clinicId: string,
  positionData: Omit<StaffPositionInsert, 'clinic_id'>
): Promise<StaffPosition> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/staff-positions?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(positionData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'スタッフ役職の作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ役職作成エラー:', error)
    throw error
  }
}

export async function updateStaffPosition(
  clinicId: string,
  positionId: string,
  updates: Partial<Omit<StaffPositionInsert, 'clinic_id'>>
): Promise<StaffPosition> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/staff-positions/${positionId}?clinic_id=${clinicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'スタッフ役職の更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ役職更新エラー:', error)
    throw error
  }
}

export async function deleteStaffPosition(
  clinicId: string,
  positionId: string
): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/staff-positions/${positionId}?clinic_id=${clinicId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'スタッフ役職の削除に失敗しました')
    }
  } catch (error) {
    console.error('スタッフ役職削除エラー:', error)
    throw error
  }
}
