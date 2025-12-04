-- 患者の特記事項アイコンを保存するテーブル
CREATE TABLE IF NOT EXISTS patient_icons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  clinic_id TEXT NOT NULL,
  icon_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(patient_id, clinic_id)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_patient_icons_patient_id ON patient_icons(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_icons_clinic_id ON patient_icons(clinic_id);

-- RLSを無効化（開発用）
ALTER TABLE patient_icons DISABLE ROW LEVEL SECURITY;

-- コメントを追加
COMMENT ON TABLE patient_icons IS '患者の特記事項アイコン';
COMMENT ON COLUMN patient_icons.patient_id IS '患者ID';
COMMENT ON COLUMN patient_icons.clinic_id IS 'クリニックID';
COMMENT ON COLUMN patient_icons.icon_ids IS 'アイコンIDの配列';
