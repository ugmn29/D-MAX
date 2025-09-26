-- 問診票テーブルの作成
-- 問診票マスタテーブル
CREATE TABLE questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 問診票質問テーブル
CREATE TABLE questionnaire_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL, -- セクション名（患者情報、主訴・症状等）
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- text, textarea, radio, checkbox, select, number, date, era_date
    options JSONB, -- 選択肢（radio, checkbox, select用）
    is_required BOOLEAN DEFAULT true,
    conditional_logic JSONB, -- 条件分岐ロジック
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 問診票回答テーブル
CREATE TABLE questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL, -- 回答データ全体
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_questionnaires_clinic ON questionnaires(clinic_id);
CREATE INDEX idx_questionnaire_questions_questionnaire ON questionnaire_questions(questionnaire_id);
CREATE INDEX idx_questionnaire_responses_patient ON questionnaire_responses(patient_id);
CREATE INDEX idx_questionnaire_responses_appointment ON questionnaire_responses(appointment_id);

-- RLS設定
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（開発環境では無効化）
-- CREATE POLICY questionnaires_clinic_access ON questionnaires
--     FOR ALL TO authenticated
--     USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

-- CREATE POLICY questionnaire_questions_clinic_access ON questionnaire_questions
--     FOR ALL TO authenticated
--     USING (questionnaire_id IN (
--         SELECT id FROM questionnaires WHERE clinic_id = (auth.jwt() ->> 'clinic_id')::uuid
--     ));

-- CREATE POLICY questionnaire_responses_clinic_access ON questionnaire_responses
--     FOR ALL TO authenticated
--     USING (questionnaire_id IN (
--         SELECT id FROM questionnaires WHERE clinic_id = (auth.jwt() ->> 'clinic_id')::uuid
--     ));
