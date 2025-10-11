-- 歯周検査記録テーブル
CREATE TABLE periodontal_examinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  examination_date DATE NOT NULL DEFAULT CURRENT_DATE,
  examiner_id UUID REFERENCES staff(id),
  measurement_type VARCHAR(10) NOT NULL DEFAULT '6point', -- '6point', '4point', '1point'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 歯ごとの検査データ
CREATE TABLE periodontal_tooth_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  examination_id UUID NOT NULL REFERENCES periodontal_examinations(id) ON DELETE CASCADE,
  tooth_number INT NOT NULL, -- 11-18, 21-28, 31-38, 41-48

  -- プラークコントロール
  plaque_present BOOLEAN DEFAULT FALSE,
  is_missing BOOLEAN DEFAULT FALSE,

  -- 動揺度 (0-3)
  mobility INT CHECK (mobility >= 0 AND mobility <= 3),

  -- PPD ポケット深さ（6点法）mm
  -- 頬側
  ppd_mb INT, -- 近心頬側 (mesio-buccal)
  ppd_b INT,  -- 頬側 (buccal)
  ppd_db INT, -- 遠心頬側 (disto-buccal)
  -- 舌側
  ppd_ml INT, -- 近心舌側 (mesio-lingual)
  ppd_l INT,  -- 舌側 (lingual)
  ppd_dl INT, -- 遠心舌側 (disto-lingual)

  -- BOP 出血（6点）
  bop_mb BOOLEAN DEFAULT FALSE,
  bop_b BOOLEAN DEFAULT FALSE,
  bop_db BOOLEAN DEFAULT FALSE,
  bop_ml BOOLEAN DEFAULT FALSE,
  bop_l BOOLEAN DEFAULT FALSE,
  bop_dl BOOLEAN DEFAULT FALSE,

  -- 排膿（6点）
  pus_mb BOOLEAN DEFAULT FALSE,
  pus_b BOOLEAN DEFAULT FALSE,
  pus_db BOOLEAN DEFAULT FALSE,
  pus_ml BOOLEAN DEFAULT FALSE,
  pus_l BOOLEAN DEFAULT FALSE,
  pus_dl BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(examination_id, tooth_number)
);

-- インデックス
CREATE INDEX idx_periodontal_examinations_patient ON periodontal_examinations(patient_id, examination_date DESC);
CREATE INDEX idx_periodontal_examinations_clinic ON periodontal_examinations(clinic_id, examination_date DESC);
CREATE INDEX idx_periodontal_tooth_data_examination ON periodontal_tooth_data(examination_id);

-- コメント
COMMENT ON TABLE periodontal_examinations IS '歯周検査記録';
COMMENT ON TABLE periodontal_tooth_data IS '歯周検査の歯ごとのデータ';
COMMENT ON COLUMN periodontal_examinations.measurement_type IS '測定方式: 6point(6点法), 4point(4点法), 1point(1点法)';
COMMENT ON COLUMN periodontal_tooth_data.tooth_number IS 'FDI歯番号: 11-18(右上), 21-28(左上), 31-38(左下), 41-48(右下)';
COMMENT ON COLUMN periodontal_tooth_data.ppd_mb IS 'ポケット深さ 近心頬側';
COMMENT ON COLUMN periodontal_tooth_data.ppd_b IS 'ポケット深さ 頬側';
COMMENT ON COLUMN periodontal_tooth_data.ppd_db IS 'ポケット深さ 遠心頬側';
COMMENT ON COLUMN periodontal_tooth_data.ppd_ml IS 'ポケット深さ 近心舌側';
COMMENT ON COLUMN periodontal_tooth_data.ppd_l IS 'ポケット深さ 舌側';
COMMENT ON COLUMN periodontal_tooth_data.ppd_dl IS 'ポケット深さ 遠心舌側';
COMMENT ON COLUMN periodontal_tooth_data.bop_mb IS '出血 近心頬側';
COMMENT ON COLUMN periodontal_tooth_data.pus_mb IS '排膿 近心頬側';

-- RLS (Row Level Security)
ALTER TABLE periodontal_examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodontal_tooth_data ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 同じクリニックのデータのみアクセス可能
CREATE POLICY periodontal_examinations_clinic_policy ON periodontal_examinations
  FOR ALL
  USING (clinic_id IN (
    SELECT clinic_id FROM staff WHERE user_id = auth.uid()
  ));

CREATE POLICY periodontal_tooth_data_clinic_policy ON periodontal_tooth_data
  FOR ALL
  USING (examination_id IN (
    SELECT id FROM periodontal_examinations
    WHERE clinic_id IN (
      SELECT clinic_id FROM staff WHERE user_id = auth.uid()
    )
  ));

-- 更新日時自動更新トリガー
CREATE TRIGGER update_periodontal_examinations_updated_at
  BEFORE UPDATE ON periodontal_examinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_periodontal_tooth_data_updated_at
  BEFORE UPDATE ON periodontal_tooth_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
