-- 通知テンプレートに複数チャネル対応フィールドを追加

-- 各チャネル用のメッセージフィールドを追加
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS line_message TEXT,
ADD COLUMN IF NOT EXISTS email_subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_message TEXT,
ADD COLUMN IF NOT EXISTS sms_message VARCHAR(160);

-- コメントを追加
COMMENT ON COLUMN notification_templates.message_template IS '汎用メッセージテンプレート（後方互換性用）';
COMMENT ON COLUMN notification_templates.line_message IS 'LINE用メッセージ（最大5000文字）';
COMMENT ON COLUMN notification_templates.email_subject IS 'メール件名';
COMMENT ON COLUMN notification_templates.email_message IS 'メール本文';
COMMENT ON COLUMN notification_templates.sms_message IS 'SMS用メッセージ（70文字推奨、160文字まで）';

-- 既存テンプレートのデータを移行（message_templateをline_messageにコピー）
UPDATE notification_templates
SET line_message = message_template
WHERE line_message IS NULL AND message_template IS NOT NULL;
