import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { getPatientById } from './patients'
import { getNotificationTemplates } from './notification-templates'

/**
 * 予約リマインド通知を作成
 */
export async function createAppointmentReminderNotification(
  appointmentId: string,
  patientId: string,
  clinicId: string,
  appointmentDatetime: string
): Promise<void> {
  const client = getSupabaseClient()

  // 患者情報を取得
  const patient = await getPatientById('11111111-1111-1111-1111-111111111111', patientId)
  if (!patient) {
    console.error('患者が見つかりません:', patientId)
    return
  }

  // 希望連絡方法を取得（デフォルトはLINE）
  const channel = patient.preferred_contact_method || 'line'

  // テンプレートを取得
  const templates = await getNotificationTemplates(clinicId)
  const reminderTemplate = templates.find(
    t => t.notification_type === 'appointment_reminder'
  )

  // 送信日時を計算（予約の3日前、18時）
  const appointmentDate = new Date(appointmentDatetime)
  const sendDate = new Date(appointmentDate)
  sendDate.setDate(sendDate.getDate() - 3) // 3日前
  sendDate.setHours(18, 0, 0, 0) // 18:00

  // 現在時刻より前の場合はスキップ
  if (sendDate < new Date()) {
    console.log('送信日時が過去のためスキップ:', sendDate)
    return
  }

  // メッセージを生成
  const message = reminderTemplate?.message_template
    .replace(/\{\{patient_name\}\}/g, patient.last_name + ' ' + patient.first_name)
    .replace(/\{\{clinic_name\}\}/g, 'クリニック名') // TODO: クリニック名を取得
    .replace(/\{\{appointment_date\}\}/g, appointmentDate.toLocaleDateString('ja-JP'))
    .replace(/\{\{appointment_datetime\}\}/g, appointmentDate.toLocaleString('ja-JP'))
    || `${patient.last_name} ${patient.first_name}様

ご予約のリマインドです。

日時：${appointmentDate.toLocaleString('ja-JP')}

ご来院をお待ちしております。`

  // 通知スケジュールを作成
  const { error } = await client
    .from('patient_notification_schedules')
    .insert({
      patient_id: patientId,
      clinic_id: clinicId,
      linked_appointment_id: appointmentId,
      template_id: reminderTemplate?.id,
      notification_type: 'appointment_reminder',
      message,
      send_datetime: sendDate.toISOString(),
      send_channel: channel,
      web_booking_enabled: false,
      status: 'scheduled',
      is_auto_reminder: false
    })

  if (error) {
    console.error('通知スケジュール作成エラー:', error)
    throw new Error('通知スケジュールの作成に失敗しました')
  }

  console.log('予約リマインド通知を作成しました:', {
    appointmentId,
    patientId,
    sendDate: sendDate.toISOString(),
    channel
  })
}

/**
 * 予約変更通知を作成
 */
export async function createAppointmentChangeNotification(
  appointmentId: string,
  patientId: string,
  clinicId: string,
  oldDatetime: string,
  newDatetime: string
): Promise<void> {
  const client = getSupabaseClient()

  // 患者情報を取得
  const patient = await getPatientById('11111111-1111-1111-1111-111111111111', patientId)
  if (!patient) {
    console.error('患者が見つかりません:', patientId)
    return
  }

  const channel = patient.preferred_contact_method || 'line'

  // テンプレートを取得
  const templates = await getNotificationTemplates(clinicId)
  const changeTemplate = templates.find(
    t => t.notification_type === 'appointment_change'
  )

  const oldDate = new Date(oldDatetime)
  const newDate = new Date(newDatetime)

  // メッセージを生成
  const message = changeTemplate?.message_template
    .replace(/\{\{patient_name\}\}/g, patient.last_name + ' ' + patient.first_name)
    .replace(/\{\{old_datetime\}\}/g, oldDate.toLocaleString('ja-JP'))
    .replace(/\{\{new_datetime\}\}/g, newDate.toLocaleString('ja-JP'))
    || `${patient.last_name} ${patient.first_name}様

ご予約が変更されました。

変更前：${oldDate.toLocaleString('ja-JP')}
変更後：${newDate.toLocaleString('ja-JP')}

よろしくお願いいたします。`

  // 即座に送信（send_datetimeは現在時刻）
  const { error } = await client
    .from('patient_notification_schedules')
    .insert({
      patient_id: patientId,
      clinic_id: clinicId,
      linked_appointment_id: appointmentId,
      template_id: changeTemplate?.id,
      notification_type: 'appointment_change',
      message,
      send_datetime: new Date().toISOString(),
      send_channel: channel,
      web_booking_enabled: false,
      status: 'scheduled',
      is_auto_reminder: false
    })

  if (error) {
    console.error('変更通知作成エラー:', error)
    throw new Error('変更通知の作成に失敗しました')
  }

  console.log('予約変更通知を作成しました:', { appointmentId, patientId })
}

/**
 * 予約キャンセル時の通知スケジュールを削除
 */
export async function cancelAppointmentNotifications(
  appointmentId: string
): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('patient_notification_schedules')
    .update({ status: 'cancelled' })
    .eq('linked_appointment_id', appointmentId)
    .in('status', ['scheduled'])

  if (error) {
    console.error('通知キャンセルエラー:', error)
    throw new Error('通知のキャンセルに失敗しました')
  }

  console.log('予約に紐づく通知をキャンセルしました:', appointmentId)
}

/**
 * 予約確定時の処理（自動リマインドをキャンセル）
 */
export async function handleAppointmentConfirmed(
  patientId: string,
  clinicId: string
): Promise<void> {
  const client = getSupabaseClient()

  // この患者の自動リマインド通知をキャンセル
  const { error } = await client
    .from('patient_notification_schedules')
    .update({ status: 'cancelled' })
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)
    .eq('is_auto_reminder', true)
    .in('status', ['scheduled'])

  if (error) {
    console.error('自動リマインドキャンセルエラー:', error)
    throw new Error('自動リマインドのキャンセルに失敗しました')
  }

  console.log('予約確定により自動リマインドをキャンセルしました:', patientId)
}
