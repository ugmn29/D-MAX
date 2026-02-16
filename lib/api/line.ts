// Migrated to Prisma API Routes
import {
  LineUserLink,
  LineUserLinkInsert,
  LineUserLinkUpdate,
  LineConversationState,
  LineConversationStateInsert,
  LineConversationStateUpdate,
  LineLinkRequest,
  PatientRelationship
} from '@/types/notification'

/**
 * LINE User IDで連携を取得
 */
export async function getLineUserLinks(lineUserId: string, clinicId?: string): Promise<LineUserLink[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({ lineUserId })
    if (clinicId) {
      params.append('clinicId', clinicId)
    }

    const response = await fetch(`${baseUrl}/api/line/user-links?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'LINE連携の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('LINE連携取得エラー:', error)
    throw new Error('LINE連携の取得に失敗しました')
  }
}

/**
 * 患者IDでLINE連携を取得
 */
export async function getPatientLineLinks(patientId: string): Promise<LineUserLink[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/user-links?patientId=${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者のLINE連携の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('患者LINE連携取得エラー:', error)
    throw new Error('患者のLINE連携の取得に失敗しました')
  }
}

/**
 * プライマリ患者を取得
 */
export async function getPrimaryPatient(lineUserId: string): Promise<LineUserLink | null> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/user-links/primary?lineUserId=${lineUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('プライマリ患者取得エラー')
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('プライマリ患者取得エラー:', error)
    return null
  }
}

/**
 * LINE User IDと患者を紐付け
 */
export async function linkLineUserToPatient(
  request: LineLinkRequest
): Promise<LineUserLink> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/user-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'LINE連携の作成に失敗しました')
    }

    return await response.json()
  } catch (error: any) {
    console.error('LINE連携作成エラー:', error)
    throw new Error(error.message || 'LINE連携の作成に失敗しました')
  }
}

/**
 * 患者切り替え
 */
export async function switchPatient(
  lineUserId: string,
  patientId: string
): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/user-links/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'switch-patient',
        lineUserId,
        patientId
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '患者切り替えに失敗しました')
    }
  } catch (error: any) {
    console.error('患者切り替えエラー:', error)
    throw new Error(error.message || '患者切り替えに失敗しました')
  }
}

/**
 * LINE連携を削除
 */
export async function unlinkLineUser(lineUserId: string, patientId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/user-links?lineUserId=${lineUserId}&patientId=${patientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'LINE連携の削除に失敗しました')
    }
  } catch (error) {
    console.error('LINE連携削除エラー:', error)
    throw new Error('LINE連携の削除に失敗しました')
  }
}

// ========================================
// 対話状態管理
// ========================================

/**
 * 対話状態を取得
 */
export async function getConversationState(lineUserId: string): Promise<LineConversationState | null> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/conversation-states?lineUserId=${lineUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('対話状態取得エラー:', error)
    return null
  }
}

/**
 * 対話状態を作成/更新
 */
export async function upsertConversationState(
  lineUserId: string,
  state: LineConversationStateUpdate
): Promise<LineConversationState> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/conversation-states`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lineUserId,
        ...state
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '対話状態の更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('対話状態更新エラー:', error)
    throw new Error('対話状態の更新に失敗しました')
  }
}

/**
 * 対話状態をリセット
 */
export async function resetConversationState(lineUserId: string): Promise<void> {
  await upsertConversationState(lineUserId, {
    state: 'idle',
    context: {},
    expires_at: null
  })
}

/**
 * 対話コンテキストを更新
 */
export async function updateConversationContext(
  lineUserId: string,
  contextUpdate: Record<string, any>
): Promise<void> {
  const current = await getConversationState(lineUserId)
  const currentContext = current?.context || {}

  await upsertConversationState(lineUserId, {
    state: current?.state || 'idle',
    context: { ...currentContext, ...contextUpdate }
  })
}

/**
 * 対話状態を次のステップに進める
 */
export async function advanceConversationState(
  lineUserId: string,
  nextState: string,
  contextUpdate?: Record<string, any>
): Promise<void> {
  const current = await getConversationState(lineUserId)
  const currentContext = current?.context || {}

  // タイムアウト設定（15分後）
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 15)

  await upsertConversationState(lineUserId, {
    state: nextState as any,
    context: { ...currentContext, ...(contextUpdate || {}) },
    expires_at: expiresAt.toISOString()
  })
}

/**
 * ブロック状態を更新
 */
export async function updateBlockStatus(
  lineUserId: string,
  patientId: string,
  isBlocked: boolean
): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/user-links/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update-block-status',
        lineUserId,
        patientId,
        isBlocked
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'ブロック状態の更新に失敗しました')
    }
  } catch (error) {
    console.error('ブロック状態更新エラー:', error)
    throw error
  }
}

/**
 * 最終やり取り日時を更新
 */
export async function updateLastInteraction(lineUserId: string, patientId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/user-links/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update-last-interaction',
        lineUserId,
        patientId
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '最終やり取り日時の更新に失敗しました')
    }
  } catch (error) {
    console.error('最終やり取り日時更新エラー:', error)
    throw error
  }
}

/**
 * 現在選択中の患者を取得
 */
export async function getCurrentPatient(lineUserId: string): Promise<string | null> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/line/user-links/current?lineUserId=${lineUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    return result.patientId || null
  } catch (error) {
    console.error('現在の患者取得エラー:', error)
    return null
  }
}
