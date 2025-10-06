-- 通知システムのテーブル作成

-- 1. 通知テンプレートテーブル
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('periodic_checkup', 'treatment_reminder', 'appointment_reminder', 'appointment_change', 'custom')),
  message_template TEXT NOT NULL,

  default_timing_value INTEGER,
  default_timing_unit VARCHAR(20) CHECK (default_timing_unit IN ('days', 'weeks', 'months')),
  default_web_booking_menu_ids UUID[],
  default_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_clinic_id ON notification_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type);

-- 2. 自動リマインドルールテーブル
CREATE TABLE IF NOT EXISTS auto_reminder_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  enabled BOOLEAN DEFAULT false,
  intervals JSONB NOT NULL DEFAULT '[]',

  on_cancel_resend_enabled BOOLEAN DEFAULT false,
  on_cancel_resend_delay_days INTEGER,
  on_cancel_resend_template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,

  fallback_enabled BOOLEAN DEFAULT false,
  fallback_order JSONB DEFAULT '["line", "email", "sms"]',

  optimize_send_time BOOLEAN DEFAULT true,
  default_send_hour INTEGER DEFAULT 18 CHECK (default_send_hour >= 0 AND default_send_hour <= 23),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(clinic_id)
);

-- 3. 患者別通知スケジュールテーブル
CREATE TABLE IF NOT EXISTS patient_notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('periodic_checkup', 'treatment_reminder', 'appointment_reminder', 'appointment_change', 'custom')),

  treatment_menu_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  treatment_name VARCHAR(255),

  message TEXT NOT NULL,
  send_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  send_channel VARCHAR(20) NOT NULL CHECK (send_channel IN ('line', 'email', 'sms')),

  web_booking_enabled BOOLEAN DEFAULT true,
  web_booking_menu_ids UUID[],
  web_booking_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  web_booking_token VARCHAR(255) UNIQUE,
  web_booking_token_expires_at TIMESTAMP WITH TIME ZONE,

  linked_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,

  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'completed', 'cancelled', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,

  is_auto_reminder BOOLEAN DEFAULT false,
  auto_reminder_sequence INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_notification_schedules_patient_id ON patient_notification_schedules(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notification_schedules_clinic_id ON patient_notification_schedules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_notification_schedules_send_datetime ON patient_notification_schedules(send_datetime);
CREATE INDEX IF NOT EXISTS idx_patient_notification_schedules_status ON patient_notification_schedules(status);
CREATE INDEX IF NOT EXISTS idx_patient_notification_schedules_token ON patient_notification_schedules(web_booking_token);

-- 4. 患者通知分析データテーブル
CREATE TABLE IF NOT EXISTS patient_notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  notification_schedule_id UUID REFERENCES patient_notification_schedules(id) ON DELETE CASCADE,

  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  send_channel VARCHAR(20) CHECK (send_channel IN ('line', 'email', 'sms')),

  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  booked_at TIMESTAMP WITH TIME ZONE,

  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),

  response_rate BOOLEAN,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_notification_analytics_patient_id ON patient_notification_analytics(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notification_analytics_sent_at ON patient_notification_analytics(sent_at);

-- 5. LINE連携テーブル（複数患者対応）
CREATE TABLE IF NOT EXISTS line_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  line_user_id VARCHAR(255) NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  relationship VARCHAR(50) CHECK (relationship IN ('self', 'spouse', 'child', 'parent', 'other')),
  nickname VARCHAR(100),

  is_primary BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,

  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_selected_at TIMESTAMP WITH TIME ZONE,
  last_interaction_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(line_user_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_line_user_links_line_user_id ON line_user_links(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_user_links_patient_id ON line_user_links(patient_id);

-- 6. LINE対話状態管理テーブル
CREATE TABLE IF NOT EXISTS line_conversation_states (
  line_user_id VARCHAR(255) PRIMARY KEY,

  state VARCHAR(50) DEFAULT 'idle' CHECK (state IN ('idle', 'linking_step1', 'linking_step2', 'adding_family_step1', 'adding_family_step2', 'adding_family_step3')),
  context JSONB DEFAULT '{}',

  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. LINE QRトークンテーブル
CREATE TABLE IF NOT EXISTS line_qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  line_user_id VARCHAR(255) NOT NULL,

  token VARCHAR(255) NOT NULL UNIQUE,
  qr_code_data TEXT NOT NULL,

  purpose VARCHAR(50) DEFAULT 'checkin' CHECK (purpose IN ('checkin', 'payment')),

  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,

  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_line_qr_tokens_token ON line_qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_line_qr_tokens_expires_at ON line_qr_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_line_qr_tokens_patient_id ON line_qr_tokens(patient_id);

-- 8. LINEリッチメニュー設定テーブル
CREATE TABLE IF NOT EXISTS line_rich_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  menu_type VARCHAR(50) CHECK (menu_type IN ('before_link', 'after_link')),
  line_rich_menu_id VARCHAR(255),
  menu_config JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_rich_menus_clinic_id ON line_rich_menus(clinic_id);

-- 9. 通知送信失敗ログテーブル
CREATE TABLE IF NOT EXISTS notification_failure_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_schedule_id UUID REFERENCES patient_notification_schedules(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  attempted_channel VARCHAR(20) CHECK (attempted_channel IN ('line', 'email', 'sms')),
  failure_reason TEXT,
  failure_type VARCHAR(50) CHECK (failure_type IN ('temporary', 'permanent')),

  is_retryable BOOLEAN DEFAULT true,
  retry_with_fallback BOOLEAN DEFAULT false,

  failed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_failure_logs_schedule_id ON notification_failure_logs(notification_schedule_id);
CREATE INDEX IF NOT EXISTS idx_notification_failure_logs_clinic_id ON notification_failure_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_notification_failure_logs_failed_at ON notification_failure_logs(failed_at);

-- 10. Web予約トークンテーブル
CREATE TABLE IF NOT EXISTS web_booking_tokens (
  token VARCHAR(255) PRIMARY KEY,
  notification_schedule_id UUID REFERENCES patient_notification_schedules(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  allowed_menu_ids UUID[],
  preferred_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_web_booking_tokens_expires_at ON web_booking_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_web_booking_tokens_patient_id ON web_booking_tokens(patient_id);

-- 既存テーブルへの列追加

-- patients テーブルに通知関連フィールドを追加
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'preferred_contact_method') THEN
    ALTER TABLE patients ADD COLUMN preferred_contact_method VARCHAR(20) CHECK (preferred_contact_method IN ('line', 'email', 'sms'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'auto_reminder_enabled') THEN
    ALTER TABLE patients ADD COLUMN auto_reminder_enabled BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'auto_reminder_custom_intervals') THEN
    ALTER TABLE patients ADD COLUMN auto_reminder_custom_intervals JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'notification_preferences') THEN
    ALTER TABLE patients ADD COLUMN notification_preferences JSONB DEFAULT '{"appointment_reminder": true, "treatment_reminder": true, "periodic_checkup": true, "other": true}';
  END IF;
END
$$;

-- appointments テーブルに来院登録フィールドを追加
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'checked_in_at') THEN
    ALTER TABLE appointments ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'check_in_method') THEN
    ALTER TABLE appointments ADD COLUMN check_in_method VARCHAR(50) CHECK (check_in_method IN ('qr_code', 'manual', 'auto'));
  END IF;
END
$$;

-- RLS設定（開発環境では無効化）
ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reminder_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notification_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notification_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_user_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_conversation_states DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_qr_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE line_rich_menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_failure_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE web_booking_tokens DISABLE ROW LEVEL SECURITY;

-- QRトークン自動期限切れ処理用の関数
CREATE OR REPLACE FUNCTION cleanup_expired_qr_tokens()
RETURNS void AS $$
BEGIN
  UPDATE line_qr_tokens
  SET status = 'expired'
  WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Web予約トークンクリーンアップ用の関数
CREATE OR REPLACE FUNCTION cleanup_expired_web_booking_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM web_booking_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 対話状態のタイムアウト処理用の関数
CREATE OR REPLACE FUNCTION cleanup_expired_conversation_states()
RETURNS void AS $$
BEGIN
  DELETE FROM line_conversation_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
