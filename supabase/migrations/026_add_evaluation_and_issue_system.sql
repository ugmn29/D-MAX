-- ==========================================
-- トレーニング評価・課題管理システム
-- 作成日: 2025-10-09
-- ==========================================

-- ==========================================
-- 1. trainingsテーブルに評価基準カラム追加
-- ==========================================

ALTER TABLE trainings
ADD COLUMN IF NOT EXISTS evaluation_level_1_label VARCHAR(100) DEFAULT 'できなかった',
ADD COLUMN IF NOT EXISTS evaluation_level_1_criteria TEXT,
ADD COLUMN IF NOT EXISTS evaluation_level_2_label VARCHAR(100) DEFAULT 'まあまあできた',
ADD COLUMN IF NOT EXISTS evaluation_level_2_criteria TEXT,
ADD COLUMN IF NOT EXISTS evaluation_level_3_label VARCHAR(100) DEFAULT 'できた',
ADD COLUMN IF NOT EXISTS evaluation_level_3_criteria TEXT;

-- ==========================================
-- 2. 課題マスタテーブル
-- ==========================================

CREATE TABLE patient_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. 課題→トレーニング紐付けテーブル
-- ==========================================

CREATE TABLE issue_training_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_code VARCHAR(50) NOT NULL REFERENCES patient_issues(code) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issue_training_mappings_issue ON issue_training_mappings(issue_code, priority);
CREATE INDEX idx_issue_training_mappings_training ON issue_training_mappings(training_id);

-- ==========================================
-- 4. 患者の課題記録テーブル
-- ==========================================

CREATE TABLE patient_issue_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    issue_code VARCHAR(50) NOT NULL REFERENCES patient_issues(code) ON DELETE CASCADE,
    identified_at TIMESTAMPTZ DEFAULT NOW(),
    identified_by UUID REFERENCES staff(id),
    severity INTEGER CHECK (severity BETWEEN 1 AND 3), -- 1:軽度, 2:中度, 3:重度
    notes TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patient_issue_records_patient ON patient_issue_records(patient_id, is_resolved);
CREATE INDEX idx_patient_issue_records_clinic ON patient_issue_records(clinic_id, identified_at DESC);

-- ==========================================
-- 5. 来院時評価テーブル
-- ==========================================

CREATE TABLE training_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES training_menus(id) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    menu_training_id UUID REFERENCES menu_trainings(id) ON DELETE CASCADE,
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    evaluator_id UUID REFERENCES staff(id),
    evaluation_level INTEGER NOT NULL CHECK (evaluation_level BETWEEN 1 AND 3),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_evaluations_patient ON training_evaluations(patient_id, evaluated_at DESC);
CREATE INDEX idx_training_evaluations_training ON training_evaluations(training_id, evaluation_level);
CREATE INDEX idx_training_evaluations_menu ON training_evaluations(menu_id);
CREATE INDEX idx_training_evaluations_clinic ON training_evaluations(clinic_id, evaluated_at DESC);

-- ==========================================
-- 6. 評価→課題判定ルールテーブル
-- ==========================================

CREATE TABLE evaluation_issue_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    evaluation_level INTEGER NOT NULL CHECK (evaluation_level BETWEEN 1 AND 3),
    identified_issue_code VARCHAR(50) NOT NULL REFERENCES patient_issues(code) ON DELETE CASCADE,
    auto_identify BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(training_id, evaluation_level, identified_issue_code)
);

CREATE INDEX idx_evaluation_issue_rules_training ON evaluation_issue_rules(training_id, evaluation_level);

-- ==========================================
-- 7. 医院ごとの評価基準カスタマイズテーブル
-- ==========================================

CREATE TABLE clinic_training_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    evaluation_level_1_label VARCHAR(100),
    evaluation_level_1_criteria TEXT,
    evaluation_level_2_label VARCHAR(100),
    evaluation_level_2_criteria TEXT,
    evaluation_level_3_label VARCHAR(100),
    evaluation_level_3_criteria TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, training_id)
);

CREATE INDEX idx_clinic_customizations_clinic ON clinic_training_customizations(clinic_id);

-- ==========================================
-- 8. RLS (Row Level Security) ポリシー
-- ==========================================

-- patient_issues テーブル (全員が読み取り可能)
ALTER TABLE patient_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_issues_read_all ON patient_issues
    FOR SELECT TO authenticated
    USING (true);

-- issue_training_mappings テーブル (全員が読み取り可能)
ALTER TABLE issue_training_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY issue_training_mappings_read_all ON issue_training_mappings
    FOR SELECT TO authenticated
    USING (true);

-- patient_issue_records テーブル
ALTER TABLE patient_issue_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_issue_records_clinic_access ON patient_issue_records
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

-- training_evaluations テーブル
ALTER TABLE training_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY training_evaluations_clinic_access ON training_evaluations
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

-- evaluation_issue_rules テーブル (全員が読み取り可能)
ALTER TABLE evaluation_issue_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY evaluation_issue_rules_read_all ON evaluation_issue_rules
    FOR SELECT TO authenticated
    USING (true);

-- clinic_training_customizations テーブル
ALTER TABLE clinic_training_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY clinic_customizations_access ON clinic_training_customizations
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

-- ==========================================
-- 9. 更新時刻自動更新トリガー
-- ==========================================

CREATE TRIGGER update_clinic_customizations_updated_at BEFORE UPDATE ON clinic_training_customizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 完了
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE 'Evaluation and issue system migration completed successfully';
    RAISE NOTICE 'Created 6 new tables: patient_issues, issue_training_mappings, patient_issue_records, training_evaluations, evaluation_issue_rules, clinic_training_customizations';
    RAISE NOTICE 'Added evaluation criteria columns to trainings table';
    RAISE NOTICE 'RLS policies enabled for all new tables';
END $$;
