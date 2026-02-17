// Migrated to Prisma API Routes
import { getNotificationSettings } from './notification-settings'
import { PatientNotificationSchedule } from '@/types/notification'
import { canReceiveNotification } from './patient-notification-preferences'

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * テンプレートからチャネル別のメッセージを取得
 */
export function getMessageForChannel(
  template: any,
  channel: 'line' | 'email' | 'sms'
): { message: string; subject?: string } {
  if (channel === 'line') {
    return {
      message: template.line_message || template.message_template || ''
    }
  } else if (channel === 'email') {
    return {
      subject: template.email_subject || '通知',
      message: template.email_message || template.message_template || ''
    }
  } else if (channel === 'sms') {
    return {
      message: template.sms_message || template.message_template?.substring(0, 160) || ''
    }
  }

  return { message: template.message_template || '' }
}

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
  const params = new URLSearchParams({
    clinic_id: clinicId,
    limit: String(limit)
  })

  const response = await fetch(`${baseUrl}/api/notification-sender/scheduled?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('通知スケジュール取得エラー:', errorData)
    throw new Error('通知スケジュールの取得に失敗しました')
  }

  const data: PatientNotificationSchedule[] = await response.json()
  return data
}

/**
 * LINE User IDを患者IDから取得（API経由）
 */
async function getLineUserIdForPatient(patientId: string): Promise<string | null> {
  const response = await fetch(`${baseUrl}/api/notification-sender/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_line_user_id',
      patient_id: patientId
    })
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return data.line_user_id || null
}

/**
 * スケジュールを送信済みとしてマーク（API経由）
 */
async function markScheduleSent(
  scheduleId: string,
  patientId: string,
  clinicId: string,
  sendChannel: string
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/notification-sender/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mark_sent',
      schedule_id: scheduleId,
      patient_id: patientId,
      clinic_id: clinicId,
      send_channel: sendChannel
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('通知送信済みマーク失敗:', errorData)
  }
}

/**
 * スケジュールを失敗としてマーク（API経由）
 */
async function markScheduleFailed(
  scheduleId: string,
  patientId: string,
  clinicId: string,
  sendChannel: string,
  failureReason: string,
  retryCount: number
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/notification-sender/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mark_failed',
      schedule_id: scheduleId,
      patient_id: patientId,
      clinic_id: clinicId,
      send_channel: sendChannel,
      failure_reason: failureReason,
      retry_count: retryCount
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('通知失敗マーク失敗:', errorData)
  }
}

/**
 * スケジュールをキャンセルとしてマーク（API経由）
 */
async function markScheduleCancelled(scheduleId: string): Promise<void> {
  const response = await fetch(`${baseUrl}/api/notification-sender/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mark_cancelled',
      schedule_id: scheduleId
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('通知キャンセルマーク失敗:', errorData)
  }
}

/**
 * 通知を送信
 */
export async function sendNotification(
  schedule: any,
  clinicId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 患者の通知受信設定をチェック
    const canReceive = await canReceiveNotification(
      schedule.patient_id,
      clinicId,
      schedule.notification_type
    )

    if (!canReceive) {
      console.log(`患者 ${schedule.patient_id} は ${schedule.notification_type} の受信を拒否しています`)
      // ステータスをキャンセルに更新
      await markScheduleCancelled(schedule.id)

      return { success: false, error: '患者が通知受信を拒否' }
    }

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
        const lineUserId = await getLineUserIdForPatient(schedule.patient_id)

        if (lineUserId) {
          success = await sendLineNotification(
            lineUserId,
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
      await markScheduleSent(
        schedule.id,
        schedule.patient_id,
        schedule.clinic_id,
        schedule.send_channel
      )

      return { success: true }
    } else {
      const retryCount = schedule.retry_count || 0

      await markScheduleFailed(
        schedule.id,
        schedule.patient_id,
        schedule.clinic_id,
        schedule.send_channel,
        failureReason || '送信に失敗しました',
        retryCount
      )

      return { success: false, error: failureReason }
    }
  } catch (error: any) {
    console.error('通知送信エラー:', error)

    // エラー記録
    await markScheduleFailed(
      schedule.id,
      schedule.patient_id,
      schedule.clinic_id,
      schedule.send_channel,
      error.message,
      schedule.retry_count || 0
    )

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
  const response = await fetch(`${baseUrl}/api/notification-sender/auto-reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clinic_id: clinicId })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('自動リマインド処理エラー:', errorData)
    return 0
  }

  const data = await response.json()
  return data.created || 0
}
