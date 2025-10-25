import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { nanoid } from 'nanoid'

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
  const {
    clinicId,
    patientId,
    treatmentMenuId,
    treatmentMenuLevel2Id,
    treatmentMenuLevel3Id,
    staffIds = [],
    expiresInDays = 7,
    createdBy,
    notificationScheduleId
  } = params

  // トークン文字列を生成（URL安全な文字のみ、21文字）
  const token = nanoid(21)

  // 有効期限を計算
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('web_booking_tokens')
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      treatment_menu_id: treatmentMenuId || null,
      treatment_menu_level2_id: treatmentMenuLevel2Id || null,
      treatment_menu_level3_id: treatmentMenuLevel3Id || null,
      staff_ids: staffIds,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: createdBy,
      notification_schedule_id: notificationScheduleId || null
    })
    .select()
    .single()

  if (error) {
    console.error('トークン生成エラー:', error)
    throw new Error('トークンの生成に失敗しました')
  }

  return data as WebBookingToken
}

/**
 * トークンを検証して情報を取得
 */
export async function validateWebBookingToken(token: string): Promise<WebBookingToken | null> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('web_booking_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !data) {
    console.error('トークン検証エラー:', error)
    return null
  }

  const tokenData = data as WebBookingToken

  // 有効期限チェック
  if (new Date(tokenData.expires_at) < new Date()) {
    console.warn('トークンの有効期限が切れています:', token)
    return null
  }

  // 使用済みチェック
  if (tokenData.used_at) {
    console.warn('トークンは既に使用済みです:', token)
    return null
  }

  return tokenData
}

/**
 * トークンを使用済みにマーク
 */
export async function markTokenAsUsed(tokenId: string): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('web_booking_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenId)

  if (error) {
    console.error('トークン使用済みマークエラー:', error)
    throw new Error('トークンの更新に失敗しました')
  }
}

/**
 * 有効期限切れのトークンを削除（クリーンアップ用）
 */
export async function cleanupExpiredTokens(clinicId: string): Promise<number> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('web_booking_tokens')
    .delete()
    .eq('clinic_id', clinicId)
    .lt('expires_at', new Date().toISOString())
    .select()

  if (error) {
    console.error('期限切れトークン削除エラー:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Web予約URLを生成
 */
export function generateWebBookingUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/web-booking?token=${token}`
}
