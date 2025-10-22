-- 通知テンプレートに自動送信フィールドを追加

ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS auto_send_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_send_trigger VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS auto_send_timing_value INTEGER,
ADD COLUMN IF NOT EXISTS auto_send_timing_unit VARCHAR(20);

-- コメントを追加
COMMENT ON COLUMN notification_templates.auto_send_enabled IS '自動送信が有効かどうか';
COMMENT ON COLUMN notification_templates.auto_send_trigger IS '送信トリガー: appointment_created, appointment_date, line_linked, manual';
COMMENT ON COLUMN notification_templates.auto_send_timing_value IS '送信タイミングの数値（例: 3日前の「3」）';
COMMENT ON COLUMN notification_templates.auto_send_timing_unit IS '送信タイミングの単位: days_before, days_after';
