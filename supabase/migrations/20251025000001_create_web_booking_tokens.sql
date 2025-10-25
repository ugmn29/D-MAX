-- Web予約トークンテーブルの作成
-- 通知からのWeb予約用に、患者情報・メニュー・担当者を事前設定したトークンを管理

DROP TABLE IF EXISTS web_booking_tokens CASCADE;

CREATE TABLE web_booking_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  -- 予約情報
  treatment_menu_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  treatment_menu_level2_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  treatment_menu_level3_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  staff_ids UUID[] DEFAULT '{}', -- 担当者IDの配列

  -- トークン管理
  token TEXT NOT NULL UNIQUE, -- URLに含めるトークン文字列
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 有効期限
  used_at TIMESTAMP WITH TIME ZONE, -- 使用済み日時（NULL = 未使用）

  -- メタデータ
  created_by TEXT NOT NULL CHECK (created_by IN ('notification_schedule', 'manual')), -- 作成元
  notification_schedule_id UUID, -- 関連する通知スケジュールID（将来の拡張用）

  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_web_booking_tokens_token ON web_booking_tokens(token);
CREATE INDEX IF NOT EXISTS idx_web_booking_tokens_patient_id ON web_booking_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_web_booking_tokens_clinic_id ON web_booking_tokens(clinic_id);
CREATE INDEX IF NOT EXISTS idx_web_booking_tokens_expires_at ON web_booking_tokens(expires_at);

-- RLS無効化（開発用）
ALTER TABLE web_booking_tokens DISABLE ROW LEVEL SECURITY;

-- コメント追加
COMMENT ON TABLE web_booking_tokens IS 'Web予約用のトークン管理テーブル。通知から直接予約できるようにメニューと担当者を事前設定';
COMMENT ON COLUMN web_booking_tokens.token IS 'URLパラメータに含めるトークン文字列（例: abc123xyz）';
COMMENT ON COLUMN web_booking_tokens.staff_ids IS '担当者IDの配列。複数の担当者から選択可能';
COMMENT ON COLUMN web_booking_tokens.created_by IS 'トークン作成元。notification_schedule: 自動通知, manual: 手動送信';
