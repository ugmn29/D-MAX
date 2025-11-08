-- 患者テーブルに来院理由と服用薬フィールドを追加

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS visit_reason TEXT,
ADD COLUMN IF NOT EXISTS medications TEXT;

COMMENT ON COLUMN patients.visit_reason IS '来院理由（初診時の主訴など）';
COMMENT ON COLUMN patients.medications IS '服用中の薬';
