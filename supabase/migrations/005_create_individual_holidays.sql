-- 個別の休診日を管理するテーブル
CREATE TABLE individual_holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_holiday BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (clinic_id, date) -- 同じクリニックの同じ日付は1つのレコードのみ
);

-- RLSを有効にする
ALTER TABLE individual_holidays ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
CREATE POLICY "Enable read access for all users" ON individual_holidays
FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users only" ON individual_holidays
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON individual_holidays
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON individual_holidays
FOR DELETE USING (auth.role() = 'authenticated');
