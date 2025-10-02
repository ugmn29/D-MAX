-- 分析機能に必要なテーブルの作成・修正

-- cancel_reasonsテーブルの作成（存在しない場合）
CREATE TABLE IF NOT EXISTS cancel_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- treatment_menusテーブルの確認・修正
DO $$
BEGIN
    -- treatment_menusテーブルが存在しない場合は作成
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treatment_menus') THEN
        CREATE TABLE treatment_menus (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price INTEGER DEFAULT 0,
            duration_minutes INTEGER DEFAULT 30,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- staffテーブルの確認・修正
DO $$
BEGIN
    -- staffテーブルが存在しない場合は作成
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') THEN
        CREATE TABLE staff (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            position_id UUID,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- staff_positionsテーブルの確認・修正
DO $$
BEGIN
    -- staff_positionsテーブルが存在しない場合は作成
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_positions') THEN
        CREATE TABLE staff_positions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- RLSを無効化（開発環境用）
ALTER TABLE cancel_reasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_positions DISABLE ROW LEVEL SECURITY;

-- デモデータの挿入
INSERT INTO cancel_reasons (clinic_id, name, sort_order, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '無断キャンセル', 1, true),
    ('11111111-1111-1111-1111-111111111111', '事前連絡', 2, true),
    ('11111111-1111-1111-1111-111111111111', '当日キャンセル', 3, true),
    ('11111111-1111-1111-1111-111111111111', '医院都合', 4, true)
ON CONFLICT DO NOTHING;

INSERT INTO treatment_menus (clinic_id, name, level, sort_order, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '初診', 1, 1, true),
    ('11111111-1111-1111-1111-111111111111', '再診', 1, 2, true),
    ('11111111-1111-1111-1111-111111111111', '定期検診', 1, 3, true),
    ('11111111-1111-1111-1111-111111111111', '歯科治療', 1, 4, true)
ON CONFLICT DO NOTHING;

INSERT INTO staff_positions (clinic_id, name, sort_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '院長', 1),
    ('11111111-1111-1111-1111-111111111111', '歯科医師', 2),
    ('11111111-1111-1111-1111-111111111111', '歯科衛生士', 3),
    ('11111111-1111-1111-1111-111111111111', '受付', 4)
ON CONFLICT DO NOTHING;

INSERT INTO staff (clinic_id, name, position_id)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '田中院長', (SELECT id FROM staff_positions WHERE name = '院長' LIMIT 1)),
    ('11111111-1111-1111-1111-111111111111', '佐藤歯科医師', (SELECT id FROM staff_positions WHERE name = '歯科医師' LIMIT 1)),
    ('11111111-1111-1111-1111-111111111111', '山田衛生士', (SELECT id FROM staff_positions WHERE name = '歯科衛生士' LIMIT 1))
ON CONFLICT DO NOTHING;
