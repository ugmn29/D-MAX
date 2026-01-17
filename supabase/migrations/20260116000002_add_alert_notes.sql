-- 患者の重要な注意事項を保存するカラムを追加
ALTER TABLE patients ADD COLUMN IF NOT EXISTS alert_notes TEXT;

-- 注意事項の確認履歴テーブルを作成
CREATE TABLE IF NOT EXISTS patient_alert_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR(255) NOT NULL,
  confirmed_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_id, confirmed_date)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_patient_alert_confirmations_patient_id
  ON patient_alert_confirmations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_alert_confirmations_confirmed_date
  ON patient_alert_confirmations(confirmed_date);

-- RLS有効化
ALTER TABLE patient_alert_confirmations ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Enable read access for all users" ON patient_alert_confirmations
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON patient_alert_confirmations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON patient_alert_confirmations
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON patient_alert_confirmations
  FOR DELETE USING (true);
