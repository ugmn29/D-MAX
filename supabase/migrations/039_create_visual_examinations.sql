-- 視診検査テーブル
CREATE TABLE visual_examinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  examination_date TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 視診歯牙データテーブル
CREATE TABLE visual_tooth_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  examination_id UUID NOT NULL REFERENCES visual_examinations(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL, -- FDI表記: 18-11, 21-28, 48-41, 31-38
  status VARCHAR(50) NOT NULL DEFAULT 'healthy', -- 'healthy', 'caries', 'restoration', 'missing', 'extraction_required', 'unerupted'
  caries_level VARCHAR(10), -- 'CO', 'C1', 'C2', 'C3', 'C4'
  restoration_type VARCHAR(20), -- 'inlay', 'crown', 'bridge'
  material_type VARCHAR(20), -- 'ceramic', 'metal', 'cad', 'hr'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_tooth_number CHECK (
    tooth_number IN (
      18, 17, 16, 15, 14, 13, 12, 11,
      21, 22, 23, 24, 25, 26, 27, 28,
      48, 47, 46, 45, 44, 43, 42, 41,
      31, 32, 33, 34, 35, 36, 37, 38
    )
  )
);

-- RLS有効化
ALTER TABLE visual_examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_tooth_data ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: visual_examinations
CREATE POLICY "Users can view visual examinations from their clinic"
  ON visual_examinations FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert visual examinations to their clinic"
  ON visual_examinations FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update visual examinations from their clinic"
  ON visual_examinations FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete visual examinations from their clinic"
  ON visual_examinations FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- RLSポリシー: visual_tooth_data
CREATE POLICY "Users can view visual tooth data from their clinic"
  ON visual_tooth_data FOR SELECT
  USING (
    examination_id IN (
      SELECT id FROM visual_examinations
      WHERE clinic_id IN (
        SELECT clinic_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert visual tooth data to their clinic"
  ON visual_tooth_data FOR INSERT
  WITH CHECK (
    examination_id IN (
      SELECT id FROM visual_examinations
      WHERE clinic_id IN (
        SELECT clinic_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update visual tooth data from their clinic"
  ON visual_tooth_data FOR UPDATE
  USING (
    examination_id IN (
      SELECT id FROM visual_examinations
      WHERE clinic_id IN (
        SELECT clinic_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete visual tooth data from their clinic"
  ON visual_tooth_data FOR DELETE
  USING (
    examination_id IN (
      SELECT id FROM visual_examinations
      WHERE clinic_id IN (
        SELECT clinic_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

-- インデックス
CREATE INDEX idx_visual_examinations_patient ON visual_examinations(patient_id);
CREATE INDEX idx_visual_examinations_clinic ON visual_examinations(clinic_id);
CREATE INDEX idx_visual_examinations_date ON visual_examinations(examination_date DESC);
CREATE INDEX idx_visual_tooth_data_examination ON visual_tooth_data(examination_id);
CREATE INDEX idx_visual_tooth_data_tooth_number ON visual_tooth_data(tooth_number);
