import { getNotificationTemplates } from './notification-templates'
import { createNotificationSchedule } from './notification-schedules'
import type { NotificationTemplate } from '@/types/notification'

/**
 * 予約作成時の自動通知スケジュールを作成
 */
export async function createAutoNotificationsForAppointment(
  clinicId: string,
  patientId: string,
  appointmentDate: string,
  appointmentTime: string
): Promise<void> {
  try {
    // 全テンプレートを取得
    const templates = await getNotificationTemplates(clinicId)

    // 自動送信が有効なテンプレートをフィルタリング
    const autoSendTemplates = templates.filter(t => t.auto_send_enabled)

    for (const template of autoSendTemplates) {
      try {
        // 予約作成時トリガーのテンプレート
        if (template.auto_send_trigger === 'appointment_created') {
          await createNotificationForTemplate(
            template,
            clinicId,
            patientId,
            appointmentDate,
            appointmentTime,
            0 // 即座に送信
          )
        }

        // 予約日基準のトリガーのテンプレート
        if (template.auto_send_trigger === 'appointment_date' && template.auto_send_timing_value) {
          const daysOffset = calculateDaysOffset(
            template.auto_send_timing_value,
            template.auto_send_timing_unit
          )

          await createNotificationForTemplate(
            template,
            clinicId,
            patientId,
            appointmentDate,
            appointmentTime,
            daysOffset
          )
        }
      } catch (error: any) {
        // 患者が通知受信を拒否している場合はスキップ
        if (error?.message?.includes('患者が通知受信を拒否')) {
          console.log(`患者 ${patientId} がテンプレート ${template.name} の受信を拒否しているためスキップ`)
        } else {
          console.error(`テンプレート ${template.name} の通知作成エラー:`, error)
        }
      }
    }

    console.log(`予約の自動通知スケジュールを作成しました: ${autoSendTemplates.length}件`)
  } catch (error) {
    console.error('自動通知スケジュール作成エラー:', error)
    // エラーは握りつぶす（予約作成は成功させる）
  }
}

/**
 * LINE連携時の自動通知を作成
 */
export async function createAutoNotificationForLineLinked(
  clinicId: string,
  patientId: string
): Promise<void> {
  try {
    const templates = await getNotificationTemplates(clinicId)

    // LINE連携トリガーのテンプレートを検索
    const lineLinkedTemplates = templates.filter(
      t => t.auto_send_enabled && t.auto_send_trigger === 'line_linked'
    )

    for (const template of lineLinkedTemplates) {
      // custom_messageを渡さない（送信時に最新のテンプレート内容を使用）
      await createNotificationSchedule({
        patient_id: patientId,
        clinic_id: clinicId,
        template_id: template.id,
        notification_type: template.notification_type,
        timing_value: 0,
        timing_unit: 'days',
        send_channel: 'line'
      })
    }

    console.log(`LINE連携の自動通知を作成しました: ${lineLinkedTemplates.length}件`)
  } catch (error) {
    console.error('LINE連携自動通知作成エラー:', error)
  }
}

/**
 * テンプレートから通知スケジュールを作成
 */
async function createNotificationForTemplate(
  template: NotificationTemplate,
  clinicId: string,
  patientId: string,
  appointmentDate: string,
  appointmentTime: string,
  daysOffset: number
): Promise<void> {
  // 送信日時を計算
  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`)
  const sendDateTime = new Date(appointmentDateTime)
  sendDateTime.setDate(sendDateTime.getDate() + daysOffset)

  // デフォルトチャネルを決定（LINE > メール > SMS の優先順位）
  let sendChannel: 'line' | 'email' | 'sms' = 'line'

  if (!template.line_message && template.email_message) {
    sendChannel = 'email'
  } else if (!template.line_message && !template.email_message && template.sms_message) {
    sendChannel = 'sms'
  }

  // タイミング値と単位を計算
  const timingValue = Math.abs(daysOffset)
  const timingUnit: 'days' | 'weeks' | 'months' = 'days'

  // custom_messageを渡さない（送信時に最新のテンプレート内容を使用）
  await createNotificationSchedule({
    patient_id: patientId,
    clinic_id: clinicId,
    template_id: template.id,
    notification_type: template.notification_type,
    timing_value: timingValue,
    timing_unit: timingUnit,
    send_channel: sendChannel
  })
}

/**
 * 日数オフセットを計算
 */
function calculateDaysOffset(value: number, unit: 'days_before' | 'days_after' | 'immediate' | null): number {
  if (unit === 'days_before') {
    return -value // マイナスで「前」を表現
  } else if (unit === 'days_after') {
    return value
  } else {
    return 0 // immediate
  }
}
