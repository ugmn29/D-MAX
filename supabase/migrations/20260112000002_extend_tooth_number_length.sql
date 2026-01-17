-- tooth_numberフィールドの長さを拡張
-- 複数の歯番号をカンマ区切りで保存できるようにする
-- 例: "18, 17, 16, 15, 14, 13, 12, 11" など

ALTER TABLE treatment_plans
ALTER COLUMN tooth_number TYPE VARCHAR(200);

COMMENT ON COLUMN treatment_plans.tooth_number IS '対象歯番号（複数の場合はカンマ区切り。例: "18, 17, 16"）';
