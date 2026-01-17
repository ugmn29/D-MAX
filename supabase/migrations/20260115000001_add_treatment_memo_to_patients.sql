-- Add treatment_memo column to patients table
-- This column stores free-form notes about treatment plans for each patient

ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_memo TEXT;

-- Add comment for documentation
COMMENT ON COLUMN patients.treatment_memo IS '治療計画メモ - 患者の治療方針や注意事項を記録';
