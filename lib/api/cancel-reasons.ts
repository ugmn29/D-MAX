// Migrated to Prisma API Routes

export interface CancelReason {
  id: string
  clinic_id: string
  name: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

// キャンセル理由一覧を取得
export async function getCancelReasons(clinicId: string): Promise<CancelReason[]> {
  try {
    const response = await fetch(`${baseUrl}/api/cancel-reasons?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'キャンセル理由の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('キャンセル理由取得エラー:', error)
    return []
  }
}

// キャンセル理由を作成
export async function createCancelReason(clinicId: string, reasonData: {
  name: string
  is_active?: boolean
}): Promise<CancelReason> {
  try {
    const response = await fetch(`${baseUrl}/api/cancel-reasons?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reasonData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'キャンセル理由の作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('キャンセル理由作成エラー:', error)
    throw error
  }
}

// キャンセル理由を更新
export async function updateCancelReason(clinicId: string, id: string, reasonData: {
  name?: string
  is_active?: boolean
}): Promise<CancelReason> {
  try {
    const response = await fetch(`${baseUrl}/api/cancel-reasons?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reasonData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'キャンセル理由の更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('キャンセル理由更新エラー:', error)
    throw error
  }
}

// キャンセル理由を削除（論理削除）
export async function deleteCancelReason(clinicId: string, id: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/cancel-reasons?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'キャンセル理由の削除に失敗しました')
    }
  } catch (error) {
    console.error('キャンセル理由削除エラー:', error)
    throw error
  }
}
