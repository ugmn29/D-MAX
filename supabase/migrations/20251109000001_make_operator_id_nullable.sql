-- operator_idをNULL許容に変更（システム操作の場合にNULLを許可）
ALTER TABLE appointment_logs
ALTER COLUMN operator_id DROP NOT NULL;

-- operator_idがNULLの場合は「システム」として扱う
COMMENT ON COLUMN appointment_logs.operator_id IS 'スタッフID（NULLの場合はシステム操作）';
