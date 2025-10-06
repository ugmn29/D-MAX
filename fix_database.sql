-- clinic_settings テーブルを作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id, setting_key)
);

-- RLSを無効化（開発環境）
ALTER TABLE clinic_settings DISABLE ROW LEVEL SECURITY;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_clinic_settings_clinic_id ON clinic_settings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_key ON clinic_settings(setting_key);
