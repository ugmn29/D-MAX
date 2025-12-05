-- =============================================
-- 本番環境用クイックマイグレーションSQL
-- =============================================
-- このファイルをSupabase SQL Editorで実行してください
-- URL: https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql

-- =============================================
-- 1. デモクリニックの作成
-- =============================================
INSERT INTO clinics (id, name, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'デモクリニック', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. すべてのテーブルのRLSを無効化
-- =============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;

-- =============================================
-- 3. clinic_settingsテーブルが存在することを確認
-- =============================================
-- このテーブルは通知設定の保存に必要です
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, setting_key)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_clinic_settings_clinic_id ON clinic_settings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_key ON clinic_settings(setting_key);

-- RLSを無効化
ALTER TABLE clinic_settings DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. notification_templatesテーブルの確認
-- =============================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'line')),
  trigger_type TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notification_templates DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. line_usersテーブルの確認
-- =============================================
CREATE TABLE IF NOT EXISTS line_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  picture_url TEXT,
  status_message TEXT,
  linked BOOLEAN DEFAULT false,
  linked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE line_users DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. staff_unit_prioritiesテーブルの確認
-- =============================================
CREATE TABLE IF NOT EXISTS staff_unit_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, unit_id)
);

ALTER TABLE staff_unit_priorities DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. appointment_staffテーブルの確認
-- =============================================
CREATE TABLE IF NOT EXISTS appointment_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  staff_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(appointment_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_staff_appointment ON appointment_staff(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_staff_staff ON appointment_staff(staff_id);

ALTER TABLE appointment_staff DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. patient_idをTEXT型に変更（必要に応じて）
-- =============================================
-- visual_examinationsテーブル
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visual_examinations' AND column_name = 'patient_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE visual_examinations
      DROP CONSTRAINT IF EXISTS visual_examinations_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- periodontal_examinationsテーブル
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'periodontal_examinations' AND column_name = 'patient_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE periodontal_examinations
      DROP CONSTRAINT IF EXISTS periodontal_examinations_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- =============================================
-- 完了メッセージ
-- =============================================
SELECT '✅ クイックマイグレーションが完了しました！' AS status;
SELECT 'clinic_settings テーブルが作成されました' AS message;
SELECT '次のステップ: Vercel環境変数を設定してください' AS next_step;
