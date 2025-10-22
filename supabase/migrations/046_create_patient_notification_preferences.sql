-- 患者ごとの通知受信設定テーブルを作成

CREATE TABLE IF NOT EXISTS patient_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- 各通知タイプの受信設定
  appointment_reminder BOOLEAN DEFAULT TRUE,
  periodic_checkup BOOLEAN DEFAULT TRUE,
  treatment_reminder BOOLEAN DEFAULT TRUE,
  appointment_change BOOLEAN DEFAULT TRUE,
  custom BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 患者とクリニックの組み合わせは一意
  UNIQUE(patient_id, clinic_id)
);

-- コメントを追加
COMMENT ON TABLE patient_notification_preferences IS '患者ごとの通知受信設定';
COMMENT ON COLUMN patient_notification_preferences.appointment_reminder IS '予約リマインド通知を受信するか';
COMMENT ON COLUMN patient_notification_preferences.periodic_checkup IS '定期検診通知を受信するか';
COMMENT ON COLUMN patient_notification_preferences.treatment_reminder IS '治療リマインド通知を受信するか';
COMMENT ON COLUMN patient_notification_preferences.appointment_change IS '予約変更通知を受信するか';
COMMENT ON COLUMN patient_notification_preferences.custom IS 'その他のカスタム通知を受信するか';

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_patient_notification_preferences_patient_id
  ON patient_notification_preferences(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notification_preferences_clinic_id
  ON patient_notification_preferences(clinic_id);

-- RLSを無効化（開発環境用）
ALTER TABLE patient_notification_preferences DISABLE ROW LEVEL SECURITY;
