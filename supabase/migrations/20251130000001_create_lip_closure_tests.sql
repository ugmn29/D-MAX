-- 口唇閉鎖検査記録テーブル
CREATE TABLE IF NOT EXISTS lip_closure_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL,
  test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  measurement_value DECIMAL(10, 2) NOT NULL, -- 測定値（数値）
  notes TEXT, -- メモ・所見
  examiner_id UUID, -- 検査実施者（スタッフID）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_lip_closure_tests_patient_id ON lip_closure_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lip_closure_tests_clinic_id ON lip_closure_tests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lip_closure_tests_test_date ON lip_closure_tests(test_date);

-- コメント
COMMENT ON TABLE lip_closure_tests IS '口唇閉鎖検査記録';
COMMENT ON COLUMN lip_closure_tests.patient_id IS '患者ID';
COMMENT ON COLUMN lip_closure_tests.clinic_id IS '医院ID';
COMMENT ON COLUMN lip_closure_tests.test_date IS '検査実施日時';
COMMENT ON COLUMN lip_closure_tests.measurement_value IS '測定値';
COMMENT ON COLUMN lip_closure_tests.notes IS 'メモ・所見';
COMMENT ON COLUMN lip_closure_tests.examiner_id IS '検査実施者ID';
