-- 勤務時間パターンテーブル
CREATE TABLE shift_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  abbreviation VARCHAR(10) NOT NULL, -- 短縮名（F, AM, PM等）
  name VARCHAR(100) NOT NULL, -- パターン名（フルタイム、午前のみ等）
  start_time TIME NOT NULL, -- 開始時間
  end_time TIME NOT NULL, -- 終了時間
  break_start TIME, -- 休憩開始時間
  break_end TIME, -- 休憩終了時間
  memo TEXT, -- メモ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clinic_id, abbreviation)
);

-- スタッフシフトテーブル
CREATE TABLE staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- 日付
  shift_pattern_id UUID REFERENCES shift_patterns(id) ON DELETE SET NULL, -- 勤務パターンID
  is_holiday BOOLEAN DEFAULT FALSE, -- 休診日フラグ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(clinic_id, staff_id, date)
);

-- インデックス作成
CREATE INDEX idx_shift_patterns_clinic_id ON shift_patterns(clinic_id);
CREATE INDEX idx_staff_shifts_clinic_id ON staff_shifts(clinic_id);
CREATE INDEX idx_staff_shifts_staff_id ON staff_shifts(staff_id);
CREATE INDEX idx_staff_shifts_date ON staff_shifts(date);

-- RLS無効化（開発環境用）
ALTER TABLE shift_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts DISABLE ROW LEVEL SECURITY;
