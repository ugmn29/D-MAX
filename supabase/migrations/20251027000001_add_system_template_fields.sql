-- 通知テンプレートにシステムテンプレート関連フィールドを追加

ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS system_template_id UUID REFERENCES system_notification_templates(id) ON DELETE SET NULL;

-- コメントを追加
COMMENT ON COLUMN notification_templates.is_system_template IS 'システムテンプレートから作成されたかどうか';
COMMENT ON COLUMN notification_templates.system_template_id IS '元となったシステムテンプレートのID';

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_notification_templates_system_template_id ON notification_templates(system_template_id);
