-- 予約とスタッフの中間テーブル作成
CREATE TABLE IF NOT EXISTS appointment_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(appointment_id, staff_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_appointment_staff_appointment_id ON appointment_staff(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_staff_staff_id ON appointment_staff(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointment_staff_is_primary ON appointment_staff(is_primary);

-- RLS無効化（開発環境用）
ALTER TABLE appointment_staff DISABLE ROW LEVEL SECURITY;

-- 既存データの移行（staff_idがある場合のみ）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'staff_id'
  ) THEN
    INSERT INTO appointment_staff (appointment_id, staff_id, is_primary)
    SELECT id, staff_id, true
    FROM appointments
    WHERE staff_id IS NOT NULL
    ON CONFLICT (appointment_id, staff_id) DO NOTHING;

    -- 既存のstaff_idカラムにコメント
    COMMENT ON COLUMN appointments.staff_id IS '後方互換性のため残している。appointment_staffテーブルを使用すること。';
  END IF;
END $$;
