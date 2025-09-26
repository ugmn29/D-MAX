-- キャンセル理由管理テーブル
CREATE TABLE cancel_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約テーブルにキャンセル理由を追加
ALTER TABLE appointments 
ADD COLUMN cancel_reason_id UUID REFERENCES cancel_reasons(id),
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancelled_by UUID REFERENCES staff(id);

-- キャンセル理由のデフォルトデータを挿入
INSERT INTO cancel_reasons (clinic_id, name, description, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', '無断キャンセル', '連絡なしでのキャンセル', 1),
('11111111-1111-1111-1111-111111111111', '事前連絡', '事前に連絡があったキャンセル', 2),
('11111111-1111-1111-1111-111111111111', '当日キャンセル', '当日のキャンセル', 3),
('11111111-1111-1111-1111-111111111111', '医院都合', '医院側の都合によるキャンセル', 4);

-- インデックス作成
CREATE INDEX idx_cancel_reasons_clinic ON cancel_reasons(clinic_id);
CREATE INDEX idx_appointments_cancel_reason ON appointments(cancel_reason_id);

-- RLS設定
ALTER TABLE cancel_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY cancel_reasons_clinic_access ON cancel_reasons
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);
