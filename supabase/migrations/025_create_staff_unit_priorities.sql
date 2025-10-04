-- スタッフユニット優先順位テーブル
CREATE TABLE staff_unit_priorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    priority_order INTEGER NOT NULL, -- 1, 2, 3... (1が最優先)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, staff_id, unit_id)
);

-- インデックス作成
CREATE INDEX idx_staff_unit_priorities_clinic_id ON staff_unit_priorities(clinic_id);
CREATE INDEX idx_staff_unit_priorities_staff_id ON staff_unit_priorities(staff_id);
CREATE INDEX idx_staff_unit_priorities_unit_id ON staff_unit_priorities(unit_id);
CREATE INDEX idx_staff_unit_priorities_priority ON staff_unit_priorities(clinic_id, staff_id, priority_order);

-- RLS無効化（開発環境用）
ALTER TABLE staff_unit_priorities DISABLE ROW LEVEL SECURITY;
