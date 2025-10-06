import { getSupabaseClient } from '@/lib/utils/supabase-client'
import {
  LineQRToken,
  LineQRTokenInsert,
  LineQRTokenUpdate,
  GenerateQRRequest,
  QRPurpose
} from '@/types/notification'
import crypto from 'crypto'

/**
 * QRコードトークンを生成
 */
export async function generateQRToken(request: GenerateQRRequest): Promise<LineQRToken> {
  const client = getSupabaseClient()

  // セキュアなトークンを生成
  const token = generateSecureToken()

  // 有効期限を設定（デフォルト5分）
  const expiresInMinutes = request.expires_in_minutes || 5
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes)

  // QRコードデータを生成（JSON形式）
  const qrData = {
    type: request.purpose || 'checkin',
    patient_id: request.patient_id,
    clinic_id: request.clinic_id,
    line_user_id: request.line_user_id,
    token: token,
    generated_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString()
  }

  const tokenData: LineQRTokenInsert = {
    clinic_id: request.clinic_id,
    patient_id: request.patient_id,
    line_user_id: request.line_user_id,
    token: token,
    qr_code_data: JSON.stringify(qrData),
    purpose: request.purpose || 'checkin',
    generated_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    status: 'active'
  }

  const { data, error } = await client
    .from('line_qr_tokens')
    .insert(tokenData)
    .select()
    .single()

  if (error) {
    console.error('QRトークン生成エラー:', error)
    throw new Error('QRトークンの生成に失敗しました')
  }

  return data
}

/**
 * トークンを検証
 */
export async function validateQRToken(token: string): Promise<LineQRToken | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('line_qr_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('QRトークン検証エラー:', error)
    return null
  }

  // 有効期限チェック
  const now = new Date()
  const expiresAt = new Date(data.expires_at)
  if (now > expiresAt) {
    // 期限切れ
    await markQRTokenAsExpired(data.id)
    return null
  }

  // ステータスチェック
  if (data.status !== 'active') {
    return null
  }

  return data
}

/**
 * トークンを使用済みにマーク
 */
export async function markQRTokenAsUsed(
  tokenId: string,
  usedAt: string = new Date().toISOString()
): Promise<void> {
  const client = getSupabaseClient()
  await client
    .from('line_qr_tokens')
    .update({
      status: 'used',
      used_at: usedAt
    })
    .eq('id', tokenId)
}

/**
 * トークンを期限切れにマーク
 */
export async function markQRTokenAsExpired(tokenId: string): Promise<void> {
  const client = getSupabaseClient()
  await client
    .from('line_qr_tokens')
    .update({
      status: 'expired'
    })
    .eq('id', tokenId)
}

/**
 * 患者の有効なQRトークンを取得
 */
export async function getActiveQRToken(
  patientId: string,
  purpose: QRPurpose = 'checkin'
): Promise<LineQRToken | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('line_qr_tokens')
    .select('*')
    .eq('patient_id', patientId)
    .eq('purpose', purpose)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('有効なQRトークン取得エラー:', error)
    return null
  }

  return data
}

/**
 * QRコードスキャン処理（来院登録）
 */
export async function processQRCodeCheckIn(token: string): Promise<{
  success: boolean
  patient?: any
  appointment?: any
  error?: string
}> {
  // トークンを検証
  const qrToken = await validateQRToken(token)
  if (!qrToken) {
    return {
      success: false,
      error: 'QRコードが無効または期限切れです'
    }
  }

  const client = getSupabaseClient()

  // 患者情報を取得
  const { data: patient, error: patientError } = await client
    .from('patients')
    .select('*')
    .eq('id', qrToken.patient_id)
    .single()

  if (patientError || !patient) {
    return {
      success: false,
      error: '患者情報が見つかりません'
    }
  }

  // 本日の予約を検索
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const { data: appointments, error: appointmentError } = await client
    .from('appointments')
    .select('*')
    .eq('patient_id', qrToken.patient_id)
    .gte('start_time', todayStart.toISOString())
    .lt('start_time', todayEnd.toISOString())
    .order('start_time', { ascending: true })

  if (appointmentError) {
    console.error('予約検索エラー:', appointmentError)
  }

  const appointment = appointments && appointments.length > 0 ? appointments[0] : null

  if (!appointment) {
    // 予約がない場合
    await markQRTokenAsUsed(qrToken.id)
    return {
      success: false,
      patient,
      error: '本日の予約がありません。受付にお声がけください。'
    }
  }

  // 来院登録
  await client
    .from('appointments')
    .update({
      checked_in_at: new Date().toISOString(),
      check_in_method: 'qr_code'
    })
    .eq('id', appointment.id)

  // トークンを使用済みにマーク
  await markQRTokenAsUsed(qrToken.id)

  // LINE通知を送信（患者のLINEに来院確認）
  await sendCheckInConfirmation(qrToken.line_user_id, patient, appointment)

  return {
    success: true,
    patient,
    appointment
  }
}

/**
 * 来院確認通知を送信（LINE）
 */
async function sendCheckInConfirmation(
  lineUserId: string,
  patient: any,
  appointment: any
): Promise<void> {
  // TODO: LINE Messaging API統合時に実装
  console.log('来院確認通知送信:', {
    lineUserId,
    patientName: patient.name,
    appointmentTime: appointment.start_time
  })
}

/**
 * 期限切れQRトークンをクリーンアップ
 */
export async function cleanupExpiredQRTokens(): Promise<number> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('line_qr_tokens')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .select()

  if (error) {
    console.error('期限切れQRトークンクリーンアップエラー:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * QRコード画像データを生成（Base64）
 */
export async function generateQRCodeImage(qrData: string): Promise<string> {
  const QRCode = require('qrcode')

  try {
    // QRコードを生成してBase64データURLとして返す
    const dataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return dataUrl
  } catch (error) {
    console.error('QRコード生成エラー:', error)
    throw new Error('QRコードの生成に失敗しました')
  }
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * セキュアなトークンを生成
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * QRトークンの使用履歴を取得
 */
export async function getQRTokenHistory(
  patientId: string,
  limit: number = 10
): Promise<LineQRToken[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('line_qr_tokens')
    .select('*')
    .eq('patient_id', patientId)
    .order('generated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('QRトークン履歴取得エラー:', error)
    return []
  }

  return data || []
}
