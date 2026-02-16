// Migrated to Prisma API Routes

export interface WebBookingToken {
  id: string
  clinic_id: string
  patient_id: string
  treatment_menu_id: string | null
  treatment_menu_level2_id: string | null
  treatment_menu_level3_id: string | null
  staff_ids: string[]
  token: string
  expires_at: string
  used_at: string | null
  created_by: 'notification_schedule' | 'manual'
  notification_schedule_id: string | null
  created_at: string
  updated_at: string
}

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * Web予約用トークンを生成
 */
export async function generateWebBookingToken(params: {
  clinicId: string
  patientId: string
  treatmentMenuId?: string
  treatmentMenuLevel2Id?: string
  treatmentMenuLevel3Id?: string
  staffIds?: string[]
  expiresInDays?: number
  createdBy: 'notification_schedule' | 'manual'
  notificationScheduleId?: string
}): Promise<WebBookingToken> {
  const response = await fetch(`${baseUrl}/api/web-booking-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clinic_id: params.clinicId,
      patient_id: params.patientId,
      treatment_menu_id: params.treatmentMenuId || null,
      treatment_menu_level2_id: params.treatmentMenuLevel2Id || null,
      treatment_menu_level3_id: params.treatmentMenuLevel3Id || null,
      staff_ids: params.staffIds || [],
      expires_in_days: params.expiresInDays ?? 7,
      created_by: params.createdBy,
      notification_schedule_id: params.notificationScheduleId || null
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('トークン生成エラー:', errorData)
    throw new Error(errorData.error || 'トークンの生成に失敗しました')
  }

  return await response.json()
}

/**
 * トークンを検証して情報を取得
 */
export async function validateWebBookingToken(token: string): Promise<WebBookingToken | null> {
  try {
    const response = await fetch(`${baseUrl}/api/web-booking-tokens/validate?token=${encodeURIComponent(token)}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('トークン検証エラー:', errorData)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('トークン検証エラー:', error)
    return null
  }
}

/**
 * トークンを使用済みにマーク
 */
export async function markTokenAsUsed(tokenId: string): Promise<void> {
  const response = await fetch(`${baseUrl}/api/web-booking-tokens/${tokenId}/mark-used`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('トークン使用済みマークエラー:', errorData)
    throw new Error(errorData.error || 'トークンの更新に失敗しました')
  }
}

/**
 * 有効期限切れのトークンを削除（クリーンアップ用）
 */
export async function cleanupExpiredTokens(clinicId: string): Promise<number> {
  try {
    const response = await fetch(`${baseUrl}/api/web-booking-tokens?clinic_id=${clinicId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('期限切れトークン削除エラー:', errorData)
      return 0
    }

    const data = await response.json()
    return data.deleted_count || 0
  } catch (error) {
    console.error('期限切れトークン削除エラー:', error)
    return 0
  }
}

/**
 * Web予約URLを生成
 */
export function generateWebBookingUrl(token: string, customBaseUrl?: string): string {
  const base = customBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/web-booking?token=${token}`
}
