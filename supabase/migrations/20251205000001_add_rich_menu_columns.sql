-- リッチメニューID用のカラムを追加
ALTER TABLE clinic_settings
ADD COLUMN IF NOT EXISTS line_registered_rich_menu_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS line_unregistered_rich_menu_id VARCHAR(255);

-- インデックスを追加（検索高速化）
CREATE INDEX IF NOT EXISTS idx_clinic_settings_registered_menu ON clinic_settings(line_registered_rich_menu_id);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_unregistered_menu ON clinic_settings(line_unregistered_rich_menu_id);
