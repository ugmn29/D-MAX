// 通知システムの型定義

// ========================================
// 列挙型
// ========================================

export type NotificationType =
  | 'periodic_checkup'      // 定期検診
  | 'treatment_reminder'     // 治療リマインド
  | 'appointment_reminder'   // 予約リマインド
  | 'appointment_change'     // 予約変更通知
  | 'custom'                 // カスタム通知

export type NotificationStatus =
  | 'scheduled'   // 送信予定
  | 'sent'        // 送信済み
  | 'completed'   // 完了（予約取得済み）
  | 'cancelled'   // キャンセル
  | 'failed'      // 送信失敗

export type NotificationChannel =
  | 'line'   // LINE
  | 'email'  // メール
  | 'sms'    // SMS

export type TimingUnit =
  | 'days'   // 日
  | 'weeks'  // 週
  | 'months' // 月

export type PatientRelationship =
  | 'self'    // 本人
  | 'spouse'  // 配偶者
  | 'child'   // 子供
  | 'parent'  // 親
  | 'other'   // その他

export type ConversationState =
  | 'idle'                    // 待機中
  | 'initial'                 // 初回（未認証）
  | 'awaiting_patient_auth'   // 患者認証待ち
  | 'authenticated'           // 認証済み
  | 'selecting_patient'       // 患者選択中
  | 'linking_step1'           // 連携: 診察券番号入力
  | 'linking_step2'           // 連携: 生年月日入力
  | 'adding_family_step1'     // 家族追加: 診察券番号入力
  | 'adding_family_step2'     // 家族追加: 生年月日入力
  | 'adding_family_step3'     // 家族追加: 続柄選択

export type QRPurpose =
  | 'checkin'  // 来院登録
  | 'payment'  // 支払い

export type QRTokenStatus =
  | 'active'   // 有効
  | 'used'     // 使用済み
  | 'expired'  // 期限切れ

export type RichMenuType =
  | 'before_link'  // 連携前
  | 'after_link'   // 連携後

export type FailureType =
  | 'temporary'   // 一時的エラー
  | 'permanent'   // 恒久的エラー

export type CheckInMethod =
  | 'qr_code'  // QRコード
  | 'manual'   // 手動
  | 'auto'     // 自動

// ========================================
// 通知テンプレート
// ========================================

export interface NotificationTemplate {
  id: string
  clinic_id: string
  name: string
  notification_type: NotificationType
  message_template: string  // 汎用メッセージ（後方互換性用）
  line_message: string | null  // LINE用メッセージ
  email_subject: string | null  // メール件名
  email_message: string | null  // メール本文
  sms_message: string | null  // SMS用メッセージ（70文字推奨）
  default_timing_value: number | null
  default_timing_unit: TimingUnit | null
  default_web_booking_menu_ids: string[] | null
  default_staff_id: string | null
  created_at: string
  updated_at: string
}

export interface NotificationTemplateInsert {
  id?: string
  clinic_id: string
  name: string
  notification_type: NotificationType
  message_template: string
  line_message?: string | null
  email_subject?: string | null
  email_message?: string | null
  sms_message?: string | null
  default_timing_value?: number | null
  default_timing_unit?: TimingUnit | null
  default_web_booking_menu_ids?: string[] | null
  default_staff_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface NotificationTemplateUpdate {
  name?: string
  notification_type?: NotificationType
  message_template?: string
  line_message?: string | null
  email_subject?: string | null
  email_message?: string | null
  sms_message?: string | null
  default_timing_value?: number | null
  default_timing_unit?: TimingUnit | null
  default_web_booking_menu_ids?: string[] | null
  default_staff_id?: string | null
  updated_at?: string
}

// ========================================
// 自動リマインドルール
// ========================================

export interface AutoReminderInterval {
  sequence: number
  value: number
  unit: TimingUnit
  template_id: string
}

export interface AutoReminderRule {
  id: string
  clinic_id: string
  enabled: boolean
  intervals: AutoReminderInterval[]
  on_cancel_resend_enabled: boolean
  on_cancel_resend_delay_days: number | null
  on_cancel_resend_template_id: string | null
  fallback_enabled: boolean
  fallback_order: NotificationChannel[]
  optimize_send_time: boolean
  default_send_hour: number
  created_at: string
  updated_at: string
}

export interface AutoReminderRuleInsert {
  id?: string
  clinic_id: string
  enabled?: boolean
  intervals: AutoReminderInterval[]
  on_cancel_resend_enabled?: boolean
  on_cancel_resend_delay_days?: number | null
  on_cancel_resend_template_id?: string | null
  fallback_enabled?: boolean
  fallback_order?: NotificationChannel[]
  optimize_send_time?: boolean
  default_send_hour?: number
  created_at?: string
  updated_at?: string
}

export interface AutoReminderRuleUpdate {
  enabled?: boolean
  intervals?: AutoReminderInterval[]
  on_cancel_resend_enabled?: boolean
  on_cancel_resend_delay_days?: number | null
  on_cancel_resend_template_id?: string | null
  fallback_enabled?: boolean
  fallback_order?: NotificationChannel[]
  optimize_send_time?: boolean
  default_send_hour?: number
  updated_at?: string
}

// ========================================
// 患者別通知スケジュール
// ========================================

export interface PatientNotificationSchedule {
  id: string
  patient_id: string
  clinic_id: string
  template_id: string | null
  notification_type: NotificationType
  treatment_menu_id: string | null
  treatment_name: string | null
  message: string
  send_datetime: string
  send_channel: NotificationChannel
  web_booking_enabled: boolean
  web_booking_menu_ids: string[] | null
  web_booking_staff_id: string | null
  web_booking_token: string | null
  web_booking_token_expires_at: string | null
  linked_appointment_id: string | null
  status: NotificationStatus
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  failure_reason: string | null
  retry_count: number
  is_auto_reminder: boolean
  auto_reminder_sequence: number | null
  created_at: string
  updated_at: string
}

export interface PatientNotificationScheduleInsert {
  id?: string
  patient_id: string
  clinic_id: string
  template_id?: string | null
  notification_type: NotificationType
  treatment_menu_id?: string | null
  treatment_name?: string | null
  message: string
  send_datetime: string
  send_channel: NotificationChannel
  web_booking_enabled?: boolean
  web_booking_menu_ids?: string[] | null
  web_booking_staff_id?: string | null
  web_booking_token?: string | null
  web_booking_token_expires_at?: string | null
  linked_appointment_id?: string | null
  status?: NotificationStatus
  sent_at?: string | null
  opened_at?: string | null
  clicked_at?: string | null
  failure_reason?: string | null
  retry_count?: number
  is_auto_reminder?: boolean
  auto_reminder_sequence?: number | null
  created_at?: string
  updated_at?: string
}

export interface PatientNotificationScheduleUpdate {
  template_id?: string | null
  notification_type?: NotificationType
  treatment_menu_id?: string | null
  treatment_name?: string | null
  message?: string
  send_datetime?: string
  send_channel?: NotificationChannel
  web_booking_enabled?: boolean
  web_booking_menu_ids?: string[] | null
  web_booking_staff_id?: string | null
  web_booking_token?: string | null
  web_booking_token_expires_at?: string | null
  linked_appointment_id?: string | null
  status?: NotificationStatus
  sent_at?: string | null
  opened_at?: string | null
  clicked_at?: string | null
  failure_reason?: string | null
  retry_count?: number
  updated_at?: string
}

// ========================================
// 患者通知分析データ
// ========================================

export interface PatientNotificationAnalytics {
  id: string
  patient_id: string
  clinic_id: string
  notification_schedule_id: string | null
  sent_at: string
  send_channel: NotificationChannel | null
  opened_at: string | null
  clicked_at: string | null
  booked_at: string | null
  hour_of_day: number | null
  day_of_week: number | null
  response_rate: boolean | null
  created_at: string
}

export interface PatientNotificationAnalyticsInsert {
  id?: string
  patient_id: string
  clinic_id: string
  notification_schedule_id?: string | null
  sent_at: string
  send_channel?: NotificationChannel | null
  opened_at?: string | null
  clicked_at?: string | null
  booked_at?: string | null
  hour_of_day?: number | null
  day_of_week?: number | null
  response_rate?: boolean | null
  created_at?: string
}

// ========================================
// LINE連携
// ========================================

export interface LineUserLink {
  id: string
  clinic_id: string
  line_user_id: string
  patient_id: string
  relationship: PatientRelationship | null
  nickname: string | null
  is_primary: boolean
  is_blocked: boolean
  linked_at: string
  last_selected_at: string | null
  last_interaction_at: string | null
  created_at: string
  updated_at: string
}

export interface LineUserLinkInsert {
  id?: string
  clinic_id: string
  line_user_id: string
  patient_id: string
  relationship?: PatientRelationship | null
  nickname?: string | null
  is_primary?: boolean
  is_blocked?: boolean
  linked_at?: string
  last_selected_at?: string | null
  last_interaction_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface LineUserLinkUpdate {
  relationship?: PatientRelationship | null
  nickname?: string | null
  is_primary?: boolean
  is_blocked?: boolean
  last_selected_at?: string | null
  last_interaction_at?: string | null
  updated_at?: string
}

// ========================================
// LINE対話状態
// ========================================

export interface LineConversationContext {
  current_patient_id?: string  // 現在選択中の患者ID
  linkingPatientNumber?: string
  linkingBirthdate?: string
  selectedPatientId?: string  // 後方互換性のため残す（current_patient_idと同じ）
  addingFamilyPatientNumber?: string
  addingFamilyBirthdate?: string
  [key: string]: any
}

export interface LineConversationState {
  line_user_id: string
  state: ConversationState
  context: LineConversationContext
  expires_at: string | null
  updated_at: string
}

export interface LineConversationStateInsert {
  line_user_id: string
  state?: ConversationState
  context?: LineConversationContext
  expires_at?: string | null
  updated_at?: string
}

export interface LineConversationStateUpdate {
  state?: ConversationState
  context?: LineConversationContext
  expires_at?: string | null
  updated_at?: string
}

// ========================================
// LINE QRトークン
// ========================================

export interface LineQRToken {
  id: string
  clinic_id: string
  patient_id: string
  line_user_id: string
  token: string
  qr_code_data: string
  purpose: QRPurpose
  generated_at: string
  expires_at: string
  used_at: string | null
  status: QRTokenStatus
}

export interface LineQRTokenInsert {
  id?: string
  clinic_id: string
  patient_id: string
  line_user_id: string
  token: string
  qr_code_data: string
  purpose?: QRPurpose
  generated_at?: string
  expires_at: string
  used_at?: string | null
  status?: QRTokenStatus
}

export interface LineQRTokenUpdate {
  used_at?: string | null
  status?: QRTokenStatus
}

// ========================================
// LINEリッチメニュー
// ========================================

export interface LineRichMenu {
  id: string
  clinic_id: string
  menu_type: RichMenuType | null
  line_rich_menu_id: string | null
  menu_config: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface LineRichMenuInsert {
  id?: string
  clinic_id: string
  menu_type?: RichMenuType | null
  line_rich_menu_id?: string | null
  menu_config?: Record<string, any> | null
  created_at?: string
  updated_at?: string
}

export interface LineRichMenuUpdate {
  menu_type?: RichMenuType | null
  line_rich_menu_id?: string | null
  menu_config?: Record<string, any> | null
  updated_at?: string
}

// ========================================
// 通知送信失敗ログ
// ========================================

export interface NotificationFailureLog {
  id: string
  notification_schedule_id: string | null
  clinic_id: string
  patient_id: string
  attempted_channel: NotificationChannel | null
  failure_reason: string | null
  failure_type: FailureType | null
  is_retryable: boolean
  retry_with_fallback: boolean
  failed_at: string
}

export interface NotificationFailureLogInsert {
  id?: string
  notification_schedule_id?: string | null
  clinic_id: string
  patient_id: string
  attempted_channel?: NotificationChannel | null
  failure_reason?: string | null
  failure_type?: FailureType | null
  is_retryable?: boolean
  retry_with_fallback?: boolean
  failed_at?: string
}

// ========================================
// Web予約トークン
// ========================================

export interface WebBookingToken {
  token: string
  notification_schedule_id: string | null
  patient_id: string
  clinic_id: string
  allowed_menu_ids: string[] | null
  preferred_staff_id: string | null
  created_at: string
  expires_at: string
  used_at: string | null
}

export interface WebBookingTokenInsert {
  token: string
  notification_schedule_id?: string | null
  patient_id: string
  clinic_id: string
  allowed_menu_ids?: string[] | null
  preferred_staff_id?: string | null
  created_at?: string
  expires_at: string
  used_at?: string | null
}

export interface WebBookingTokenUpdate {
  used_at?: string | null
}

// ========================================
// 患者の通知設定
// ========================================

export interface PatientNotificationPreferences {
  appointment_reminder: boolean
  treatment_reminder: boolean
  periodic_checkup: boolean
  other: boolean
}

// ========================================
// ユーティリティ型
// ========================================

// 通知スケジュール作成時のパラメータ
export interface CreateNotificationScheduleParams {
  patient_id: string
  clinic_id: string
  template_id?: string
  notification_type: NotificationType
  treatment_menu_id?: string
  treatment_name?: string
  timing_value: number
  timing_unit: TimingUnit
  send_channel: NotificationChannel
  web_booking_menu_ids?: string[]
  web_booking_staff_id?: string
  custom_message?: string
}

// LINE連携リクエスト
export interface LineLinkRequest {
  line_user_id: string
  clinic_id: string
  patient_number: string
  birthdate: string
  relationship?: PatientRelationship
}

// QRコード生成リクエスト
export interface GenerateQRRequest {
  patient_id: string
  clinic_id: string
  line_user_id: string
  purpose?: QRPurpose
  expires_in_minutes?: number
}
