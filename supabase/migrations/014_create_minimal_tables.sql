-- 最小限のテーブル作成（開発環境用）
-- RLSを無効化してテーブルを作成

-- クリニックテーブル
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    time_slot_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クリニック設定テーブル
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id, setting_key)
);

-- 診療メニューテーブル
CREATE TABLE IF NOT EXISTS treatment_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES treatment_menus(id),
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    name VARCHAR(255) NOT NULL,
    standard_duration INTEGER,
    color VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- デモクリニックの作成
INSERT INTO clinics (id, name, time_slot_minutes) 
VALUES ('11111111-1111-1111-1111-111111111111', 'デモクリニック', 15)
ON CONFLICT (id) DO NOTHING;

-- デモ設定の作成
INSERT INTO clinic_settings (clinic_id, setting_key, setting_value)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'time_slot_minutes', '15'),
    ('11111111-1111-1111-1111-111111111111', 'display_items', '[]'),
    ('11111111-1111-1111-1111-111111111111', 'cell_height', '40')
ON CONFLICT (clinic_id, setting_key) DO NOTHING;
