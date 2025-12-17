import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { getPatientById } from './patients'
import { getNotificationTemplates } from './notification-templates'
import { canReceiveNotification } from './patient-notification-preferences'

/**
 * テンプレートの送信タイミング設定から送信日時を計算
 */
function calculateSendDateTime(
  appointmentDatetime: string,
  timingValue: number | null,
  timingUnit: string | null
): Date {
  const appointmentDate = new Date(appointmentDatetime)
  const sendDate = new Date(appointmentDate)

  // デフォルトは3日前
  const value = timingValue || 3
  const unit = timingUnit || 'days_before'

  if (unit === 'days_before') {
    sendDate.setDate(sendDate.getDate() - value)
  } else if (unit === 'days_after') {
    sendDate.setDate(sendDate.getDate() + value)
  } else if (unit === 'immediate') {
    return new Date() // 即座に送信
  }

  // 送信時刻は18:00に設定
  sendDate.setHours(18, 0, 0, 0)

  return sendDate
}

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

  // 患者の通知受信設定をチェック
  const canReceive = await canReceiveNotification(patientId, clinicId, 'appointment_reminder')
  if (!canReceive) {
    console.log(`患者 ${patientId} は予約リマインド通知の受信を拒否しているため、通知を作成しません`)
    return
  }

  // 患者情報を取得
  const patient = await getPatientById(clinicId, patientId)
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

  // テンプレートの送信タイミング設定を使用して送信日時を計算
  const sendDate = calculateSendDateTime(
    appointmentDatetime,
    reminderTemplate?.auto_send_timing_value ?? null,
    reminderTemplate?.auto_send_timing_unit ?? null
  )

  // 現在時刻より前の場合はスキップ
  if (sendDate < new Date()) {
    console.log('送信日時が過去のためスキップ:', sendDate)
    return
  }

  const appointmentDate = new Date(appointmentDatetime)

  // メッセージを生成（line_messageを優先、なければmessage_template）
  const templateMessage = reminderTemplate?.line_message || reminderTemplate?.message_template
  const message = templateMessage
    ?.replace(/\{patient_name\}/g, patient.last_name + ' ' + patient.first_name)
    ?.replace(/\{\{patient_name\}\}/g, patient.last_name + ' ' + patient.first_name)
    ?.replace(/\{clinic_name\}/g, 'クリニック')
    ?.replace(/\{\{clinic_name\}\}/g, 'クリニック')
    ?.replace(/\{appointment_date\}/g, appointmentDate.toLocaleDateString('ja-JP'))
    ?.replace(/\{\{appointment_date\}\}/g, appointmentDate.toLocaleDateString('ja-JP'))
    ?.replace(/\{appointment_datetime\}/g, appointmentDate.toLocaleString('ja-JP'))
    ?.replace(/\{\{appointment_datetime\}\}/g, appointmentDate.toLocaleString('ja-JP'))
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
    timingValue: reminderTemplate?.auto_send_timing_value,
    timingUnit: reminderTemplate?.auto_send_timing_unit,
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

  // 患者の通知受信設定をチェック
  const canReceive = await canReceiveNotification(patientId, clinicId, 'appointment_change')
  if (!canReceive) {
    console.log(`患者 ${patientId} は予約変更通知の受信を拒否しているため、通知を作成しません`)
    return
  }

  // 患者情報を取得
  const patient = await getPatientById(clinicId, patientId)
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

  // テンプレートの送信タイミング設定を使用（デフォルトは即座に送信）
  const sendDate = calculateSendDateTime(
    newDatetime,
    changeTemplate?.auto_send_timing_value ?? null,
    changeTemplate?.auto_send_timing_unit ?? 'immediate'
  )

  // メッセージを生成（line_messageを優先、なければmessage_template）
  const templateMessage = changeTemplate?.line_message || changeTemplate?.message_template
  const message = templateMessage
    ?.replace(/\{patient_name\}/g, patient.last_name + ' ' + patient.first_name)
    ?.replace(/\{\{patient_name\}\}/g, patient.last_name + ' ' + patient.first_name)
    ?.replace(/\{old_datetime\}/g, oldDate.toLocaleString('ja-JP'))
    ?.replace(/\{\{old_datetime\}\}/g, oldDate.toLocaleString('ja-JP'))
    ?.replace(/\{new_datetime\}/g, newDate.toLocaleString('ja-JP'))
    ?.replace(/\{\{new_datetime\}\}/g, newDate.toLocaleString('ja-JP'))
    ?.replace(/\{appointment_datetime\}/g, newDate.toLocaleString('ja-JP'))
    ?.replace(/\{\{appointment_datetime\}\}/g, newDate.toLocaleString('ja-JP'))
    || `${patient.last_name} ${patient.first_name}様

ご予約が変更されました。

変更前：${oldDate.toLocaleString('ja-JP')}
変更後：${newDate.toLocaleString('ja-JP')}

よろしくお願いいたします。`

  const { error } = await client
    .from('patient_notification_schedules')
    .insert({
      patient_id: patientId,
      clinic_id: clinicId,
      linked_appointment_id: appointmentId,
      template_id: changeTemplate?.id,
      notification_type: 'appointment_change',
      message,
      send_datetime: sendDate.toISOString(),
      send_channel: channel,
      web_booking_enabled: false,
      status: 'scheduled',
      is_auto_reminder: false
    })

  if (error) {
    console.error('変更通知作成エラー:', error)
    throw new Error('変更通知の作成に失敗しました')
  }

  console.log('予約変更通知を作成しました:', {
    appointmentId,
    patientId,
    sendDate: sendDate.toISOString(),
    timingUnit: changeTemplate?.auto_send_timing_unit || 'immediate'
  })
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
 * 予約確定時の処理（自動リマインドをキャンセル + 確定通知送信）
 */
export async function handleAppointmentConfirmed(
  patientId: string,
  clinicId: string,
  appointmentId?: string,
  appointmentDatetime?: string
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

/**
 * 予約確定通知を送信
 */
export async function createAppointmentConfirmationNotification(
  appointmentId: string,
  patientId: string,
  clinicId: string,
  appointmentDatetime: string
): Promise<void> {
  const client = getSupabaseClient()

  // 患者の通知受信設定をチェック
  const canReceive = await canReceiveNotification(patientId, clinicId, 'appointment_confirmation')
  if (!canReceive) {
    console.log(`患者 ${patientId} は予約確定通知の受信を拒否しているため、通知を作成しません`)
    return
  }

  // 患者情報を取得
  const patient = await getPatientById(clinicId, patientId)
  if (!patient) {
    console.error('患者が見つかりません:', patientId)
    return
  }

  const channel = patient.preferred_contact_method || 'line'

  // テンプレートを取得
  const templates = await getNotificationTemplates(clinicId)
  const confirmTemplate = templates.find(
    t => t.notification_type === 'appointment_confirmation'
  )

  const appointmentDate = new Date(appointmentDatetime)

  // テンプレートの送信タイミング設定を使用（デフォルトは即座に送信）
  const sendDate = calculateSendDateTime(
    appointmentDatetime,
    confirmTemplate?.auto_send_timing_value ?? null,
    confirmTemplate?.auto_send_timing_unit ?? 'immediate'
  )

  // メッセージを生成（line_messageを優先、なければmessage_template）
  const templateMessage = confirmTemplate?.line_message || confirmTemplate?.message_template
  const message = templateMessage
    ?.replace(/\{patient_name\}/g, patient.last_name + ' ' + patient.first_name)
    ?.replace(/\{\{patient_name\}\}/g, patient.last_name + ' ' + patient.first_name)
    ?.replace(/\{appointment_date\}/g, appointmentDate.toLocaleDateString('ja-JP'))
    ?.replace(/\{\{appointment_date\}\}/g, appointmentDate.toLocaleDateString('ja-JP'))
    ?.replace(/\{appointment_datetime\}/g, appointmentDate.toLocaleString('ja-JP'))
    ?.replace(/\{\{appointment_datetime\}\}/g, appointmentDate.toLocaleString('ja-JP'))
    || `${patient.last_name} ${patient.first_name}様

ご予約が確定しました。

日時：${appointmentDate.toLocaleString('ja-JP')}

ご来院をお待ちしております。`

  const { error: insertError } = await client
    .from('patient_notification_schedules')
    .insert({
      patient_id: patientId,
      clinic_id: clinicId,
      linked_appointment_id: appointmentId,
      template_id: confirmTemplate?.id,
      notification_type: 'appointment_confirmation',
      message,
      send_datetime: sendDate.toISOString(),
      send_channel: channel,
      web_booking_enabled: false,
      status: 'scheduled',
      is_auto_reminder: false
    })

  if (insertError) {
    console.error('予約確定通知作成エラー:', insertError)
    throw new Error('予約確定通知の作成に失敗しました')
  }

  console.log('予約確定通知を作成しました:', {
    appointmentId,
    patientId,
    sendDate: sendDate.toISOString(),
    timingUnit: confirmTemplate?.auto_send_timing_unit || 'immediate'
  })
}
