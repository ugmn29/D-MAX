import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { getNotificationSettings } from './notification-settings'
import { PatientNotificationSchedule } from '@/types/notification'

/**
 * LINE メッセージを送信
 */
async function sendLineNotification(
  toUserId: string,
  message: string,
  channelAccessToken: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        to: toUserId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LINE送信エラー:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('LINE送信例外:', error)
    return false
  }
}

/**
 * メール送信
 */
async function sendEmailNotification(
  to: string,
  subject: string,
  message: string,
  settings: any
): Promise<boolean> {
  try {
    // TODO: 実際のSMTPライブラリ（nodemailer等）を使用
    console.log('メール送信:', { to, subject, message, settings })
    return true
  } catch (error) {
    console.error('メール送信エラー:', error)
    return false
  }
}

/**
 * SMS送信
 */
async function sendSmsNotification(
  to: string,
  message: string,
  settings: any
): Promise<boolean> {
  try {
    // TODO: 実際のSMS APIライブラリ（Twilio等）を使用
    console.log('SMS送信:', { to, message, settings })
    return true
  } catch (error) {
    console.error('SMS送信エラー:', error)
    return false
  }
}

/**
 * 送信予定の通知を取得
 */
export async function getScheduledNotifications(
  clinicId: string,
  limit = 100
): Promise<PatientNotificationSchedule[]> {
  const client = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await client
    .from('patient_notification_schedules')
    .select(`
      *,
      patients:patient_id (
        id,
        name,
        email,
        phone,
        preferred_contact_method
      )
    `)
    .eq('clinic_id', clinicId)
    .eq('status', 'scheduled')
    .lte('send_datetime', now)
    .order('send_datetime', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('通知スケジュール取得エラー:', error)
    throw new Error('通知スケジュールの取得に失敗しました')
  }

  return data || []
}

/**
 * 通知を送信
 */
export async function sendNotification(
  schedule: any,
  clinicId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient()

  try {
    // 通知設定を取得
    const settings = await getNotificationSettings(clinicId)
    if (!settings) {
      throw new Error('通知設定が見つかりません')
    }

    let success = false
    let failureReason = ''

    // チャンネルに応じて送信
    if (schedule.send_channel === 'line') {
      if (!settings.line.enabled || !settings.line.channel_access_token) {
        failureReason = 'LINE設定が無効です'
      } else {
        // LINE User IDを取得
        const { data: lineLink } = await client
          .from('line_user_links')
          .select('line_user_id')
          .eq('patient_id', schedule.patient_id)
          .eq('is_primary', true)
          .single()

        if (lineLink) {
          success = await sendLineNotification(
            lineLink.line_user_id,
            schedule.message,
            settings.line.channel_access_token
          )
        } else {
          failureReason = 'LINE連携されていません'
        }
      }
    } else if (schedule.send_channel === 'email') {
      if (!settings.email.enabled) {
        failureReason = 'メール設定が無効です'
      } else if (!schedule.patients?.email) {
        failureReason = 'メールアドレスが登録されていません'
      } else {
        success = await sendEmailNotification(
          schedule.patients.email,
          '通知',
          schedule.message,
          settings.email
        )
      }
    } else if (schedule.send_channel === 'sms') {
      if (!settings.sms.enabled) {
        failureReason = 'SMS設定が無効です'
      } else if (!schedule.patients?.phone) {
        failureReason = '電話番号が登録されていません'
      } else {
        success = await sendSmsNotification(
          schedule.patients.phone,
          schedule.message,
          settings.sms
        )
      }
    }

    // ステータス更新
    if (success) {
      await client
        .from('patient_notification_schedules')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule.id)

      // 分析データ記録
      await client
        .from('patient_notification_analytics')
        .insert({
          patient_id: schedule.patient_id,
          clinic_id: schedule.clinic_id,
          notification_schedule_id: schedule.id,
          sent_at: new Date().toISOString(),
          send_channel: schedule.send_channel,
          notification_type: schedule.notification_type
        })

      return { success: true }
    } else {
      // 失敗記録
      const retryCount = schedule.retry_count || 0

      await client
        .from('patient_notification_schedules')
        .update({
          status: retryCount >= 3 ? 'failed' : 'scheduled',
          failure_reason: failureReason || '送信に失敗しました',
          retry_count: retryCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule.id)

      // 失敗ログに記録
      await client
        .from('notification_failure_logs')
        .insert({
          notification_schedule_id: schedule.id,
          patient_id: schedule.patient_id,
          clinic_id: schedule.clinic_id,
          send_channel: schedule.send_channel,
          error_message: failureReason || '送信に失敗しました',
          retry_count: retryCount + 1
        })

      return { success: false, error: failureReason }
    }
  } catch (error: any) {
    console.error('通知送信エラー:', error)

    // エラー記録
    await client
      .from('patient_notification_schedules')
      .update({
        status: 'failed',
        failure_reason: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', schedule.id)

    return { success: false, error: error.message }
  }
}

/**
 * バッチ処理: スケジュールされた通知を送信
 */
export async function processPendingNotifications(clinicId: string): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const schedules = await getScheduledNotifications(clinicId)

  let succeeded = 0
  let failed = 0

  for (const schedule of schedules) {
    const result = await sendNotification(schedule, clinicId)
    if (result.success) {
      succeeded++
    } else {
      failed++
    }
  }

  return {
    processed: schedules.length,
    succeeded,
    failed
  }
}

/**
 * 自動リマインド候補を検出して通知を作成
 */
export async function processAutoReminders(clinicId: string): Promise<number> {
  const client = getSupabaseClient()

  // 自動リマインドルールを取得
  const { data: rule } = await client
    .from('auto_reminder_rules')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('enabled', true)
    .single()

  if (!rule) {
    return 0
  }

  // 候補患者を検出（最終来院日から指定期間経過）
  const intervals = rule.intervals || []
  let created = 0

  for (const interval of intervals) {
    const monthsAgo = interval.months
    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() - monthsAgo)

    // 最終来院日が対象期間の患者を取得
    const { data: candidates } = await client
      .from('appointments')
      .select('patient_id, MAX(start_time) as last_visit')
      .eq('clinic_id', clinicId)
      .eq('status', 'completed')
      .gte('start_time', targetDate.toISOString())
      .group('patient_id')

    if (!candidates) continue

    for (const candidate of candidates) {
      // 既に通知スケジュールが存在しないか確認
      const { data: existing } = await client
        .from('patient_notification_schedules')
        .select('id')
        .eq('patient_id', candidate.patient_id)
        .eq('is_auto_reminder', true)
        .eq('auto_reminder_sequence', interval.sequence)
        .in('status', ['scheduled', 'sent'])
        .single()

      if (existing) continue

      // 通知スケジュールを作成
      const sendDate = new Date()
      sendDate.setHours(rule.default_send_hour || 18, 0, 0, 0)

      await client
        .from('patient_notification_schedules')
        .insert({
          patient_id: candidate.patient_id,
          clinic_id: clinicId,
          template_id: interval.template_id,
          notification_type: 'periodic_checkup',
          message: interval.message || '定期検診のお知らせです',
          send_datetime: sendDate.toISOString(),
          send_channel: interval.channel || 'line',
          status: 'scheduled',
          is_auto_reminder: true,
          auto_reminder_sequence: interval.sequence
        })

      created++
    }
  }

  return created
}
