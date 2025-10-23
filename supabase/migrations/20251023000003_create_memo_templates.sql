-- memo_templatesテーブルの作成
CREATE TABLE IF NOT EXISTS memo_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを無効化（開発環境用）
ALTER TABLE memo_templates DISABLE ROW LEVEL SECURITY;

-- デモデータの挿入
INSERT INTO memo_templates (clinic_id, name, content, sort_order, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', '初診時対応', '初診時対応', 1, true),
    ('11111111-1111-1111-1111-111111111111', '治療計画説明', '治療計画説明', 2, true),
    ('11111111-1111-1111-1111-111111111111', '次回予約', '次回予約', 3, true),
    ('11111111-1111-1111-1111-111111111111', '緊急対応', '緊急対応', 4, true)
ON CONFLICT DO NOTHING;
