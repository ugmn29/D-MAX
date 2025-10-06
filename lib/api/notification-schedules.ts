import { getSupabaseClient } from '@/lib/utils/supabase-client'
import {
  PatientNotificationSchedule,
  PatientNotificationScheduleInsert,
  PatientNotificationScheduleUpdate,
  CreateNotificationScheduleParams,
  NotificationChannel
} from '@/types/notification'
import { replaceTemplateVariables } from './notification-templates'
import crypto from 'crypto'

/**
 * クリニックの全通知スケジュールを取得
 */
export async function getClinicNotificationSchedules(
  clinicId: string,
  filters?: {
    status?: string
    notification_type?: string
    send_date_from?: string
    send_date_to?: string
  }
): Promise<PatientNotificationSchedule[]> {
  const client = getSupabaseClient()
  let query = client
    .from('patient_notification_schedules')
    .select('*')
    .eq('clinic_id', clinicId)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.notification_type) {
    query = query.eq('notification_type', filters.notification_type)
  }

  if (filters?.send_date_from) {
    query = query.gte('send_datetime', filters.send_date_from)
  }

  if (filters?.send_date_to) {
    query = query.lte('send_datetime', filters.send_date_to)
  }

  query = query.order('send_datetime', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('通知スケジュール取得エラー:', error)
    throw new Error('通知スケジュールの取得に失敗しました')
  }

  return data || []
}

/**
 * 患者の通知スケジュールを取得
 */
export async function getPatientNotificationSchedules(
  patientId: string
): Promise<PatientNotificationSchedule[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patient_notification_schedules')
    .select('*')
    .eq('patient_id', patientId)
    .order('send_datetime', { ascending: true })

  if (error) {
    console.error('患者通知スケジュール取得エラー:', error)
    throw new Error('患者の通知スケジュールの取得に失敗しました')
  }

  return data || []
}

/**
 * 通知スケジュールをIDで取得
 */
export async function getNotificationSchedule(id: string): Promise<PatientNotificationSchedule | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patient_notification_schedules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('通知スケジュール取得エラー:', error)
    throw new Error('通知スケジュールの取得に失敗しました')
  }

  return data
}

/**
 * 通知スケジュールを作成
 */
export async function createNotificationSchedule(
  params: CreateNotificationScheduleParams
): Promise<PatientNotificationSchedule> {
  const client = getSupabaseClient()

  // 送信日時を計算
  const sendDatetime = calculateSendDatetime(params.timing_value, params.timing_unit)

  // Web予約トークンを生成
  const webBookingToken = generateSecureToken()
  const webBookingTokenExpiresAt = calculateTokenExpiry(sendDatetime)

  // テンプレートからメッセージを作成（カスタムメッセージがあればそれを使用）
  const message = params.custom_message || ''

  const insertData: PatientNotificationScheduleInsert = {
    patient_id: params.patient_id,
    clinic_id: params.clinic_id,
    template_id: params.template_id,
    notification_type: params.notification_type,
    treatment_menu_id: params.treatment_menu_id,
    treatment_name: params.treatment_name,
    message,
    send_datetime: sendDatetime,
    send_channel: params.send_channel,
    web_booking_enabled: params.web_booking_menu_ids && params.web_booking_menu_ids.length > 0,
    web_booking_menu_ids: params.web_booking_menu_ids || null,
    web_booking_staff_id: params.web_booking_staff_id,
    web_booking_token: webBookingToken,
    web_booking_token_expires_at: webBookingTokenExpiresAt,
    status: 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await client
    .from('patient_notification_schedules')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('通知スケジュール作成エラー:', error)
    throw new Error('通知スケジュールの作成に失敗しました')
  }

  // Web予約トークンを別テーブルに保存
  if (data.web_booking_enabled) {
    await createWebBookingToken({
      token: webBookingToken,
      notification_schedule_id: data.id,
      patient_id: params.patient_id,
      clinic_id: params.clinic_id,
      allowed_menu_ids: params.web_booking_menu_ids || null,
      preferred_staff_id: params.web_booking_staff_id,
      expires_at: webBookingTokenExpiresAt
    })
  }

  return data
}

/**
 * 通知スケジュールを更新
 */
export async function updateNotificationSchedule(
  id: string,
  updates: PatientNotificationScheduleUpdate
): Promise<PatientNotificationSchedule> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patient_notification_schedules')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('通知スケジュール更新エラー:', error)
    throw new Error('通知スケジュールの更新に失敗しました')
  }

  return data
}

/**
 * 通知スケジュールを削除
 */
export async function deleteNotificationSchedule(id: string): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client
    .from('patient_notification_schedules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('通知スケジュール削除エラー:', error)
    throw new Error('通知スケジュールの削除に失敗しました')
  }
}

/**
 * 送信予定の通知を取得（バッチ処理用）
 */
export async function getScheduledNotifications(
  fromDatetime: string,
  toDatetime: string
): Promise<PatientNotificationSchedule[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patient_notification_schedules')
    .select('*')
    .eq('status', 'scheduled')
    .gte('send_datetime', fromDatetime)
    .lte('send_datetime', toDatetime)
    .order('send_datetime', { ascending: true })

  if (error) {
    console.error('送信予定通知取得エラー:', error)
    throw new Error('送信予定通知の取得に失敗しました')
  }

  return data || []
}

/**
 * 通知を送信済みにマーク
 */
export async function markNotificationAsSent(
  id: string,
  sentAt: string = new Date().toISOString()
): Promise<void> {
  await updateNotificationSchedule(id, {
    status: 'sent',
    sent_at: sentAt
  })
}

/**
 * 通知を失敗にマーク
 */
export async function markNotificationAsFailed(
  id: string,
  failureReason: string,
  retryCount: number
): Promise<void> {
  await updateNotificationSchedule(id, {
    status: 'failed',
    failure_reason: failureReason,
    retry_count: retryCount
  })
}

/**
 * 通知を完了にマーク（予約取得済み）
 */
export async function markNotificationAsCompleted(
  id: string,
  appointmentId: string
): Promise<void> {
  await updateNotificationSchedule(id, {
    status: 'completed',
    linked_appointment_id: appointmentId
  })
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * 送信日時を計算
 */
function calculateSendDatetime(value: number, unit: string): string {
  const now = new Date()
  const sendDate = new Date(now)

  switch (unit) {
    case 'days':
      sendDate.setDate(sendDate.getDate() + value)
      break
    case 'weeks':
      sendDate.setDate(sendDate.getDate() + value * 7)
      break
    case 'months':
      sendDate.setMonth(sendDate.getMonth() + value)
      break
  }

  return sendDate.toISOString()
}

/**
 * トークン有効期限を計算（次回通知送信時まで）
 */
function calculateTokenExpiry(sendDatetime: string): string {
  // 送信日時の時点では有効、その後の通知送信時に期限切れ
  const sendDate = new Date(sendDatetime)
  // 送信日から30日後まで有効とする（デフォルト）
  const expiryDate = new Date(sendDate)
  expiryDate.setDate(expiryDate.getDate() + 30)
  return expiryDate.toISOString()
}

/**
 * セキュアなトークンを生成
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Web予約トークンを作成
 */
async function createWebBookingToken(tokenData: any): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client
    .from('web_booking_tokens')
    .insert({
      ...tokenData,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Web予約トークン作成エラー:', error)
    // エラーでも通知スケジュールの作成は成功させる
  }
}

/**
 * 患者の最適な送信時刻を取得（分析データから）
 */
export async function getOptimalSendTime(patientId: string): Promise<number | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patient_notification_analytics')
    .select('hour_of_day, response_rate')
    .eq('patient_id', patientId)
    .eq('response_rate', true)
    .order('hour_of_day', { ascending: false })
    .limit(10)

  if (error || !data || data.length === 0) {
    return null
  }

  // 反応率の高い時間帯の平均を計算
  const hours = data.map(d => d.hour_of_day).filter(h => h !== null) as number[]
  if (hours.length === 0) return null

  const avgHour = Math.round(hours.reduce((sum, h) => sum + h, 0) / hours.length)
  return avgHour
}
