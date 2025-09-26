-- patient_note_typesテーブルの作成
CREATE TABLE IF NOT EXISTS patient_note_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを無効化（開発環境用）
ALTER TABLE patient_note_types DISABLE ROW LEVEL SECURITY;

-- デモデータの挿入
INSERT INTO patient_note_types (clinic_id, name, sort_order, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'アレルギー', 1, true),
    ('11111111-1111-1111-1111-111111111111', '既往歴', 2, true),
    ('11111111-1111-1111-1111-111111111111', '服用薬', 3, true),
    ('11111111-1111-1111-1111-111111111111', '注意事項', 4, true)
ON CONFLICT DO NOTHING;
