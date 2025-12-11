-- LINE関連テーブルのpatient_idをUUIDからTEXTに変更
-- patient_idは実際には "patient_TIMESTAMP_RANDOM" 形式の文字列であるため修正が必要

-- 1. line_invitation_codesテーブルのpatient_idをTEXTに変更
DO $$
BEGIN
  -- 既存の外部キー制約を削除
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'line_invitation_codes_patient_id_fkey'
    AND table_name = 'line_invitation_codes'
  ) THEN
    ALTER TABLE line_invitation_codes DROP CONSTRAINT line_invitation_codes_patient_id_fkey;
  END IF;

  -- カラムの型をTEXTに変更
  ALTER TABLE line_invitation_codes ALTER COLUMN patient_id TYPE TEXT;

  RAISE NOTICE 'line_invitation_codes.patient_id を TEXT 型に変更しました';
END $$;

-- 2. line_patient_linkagesテーブルのpatient_idをTEXTに変更
DO $$
BEGIN
  -- 既存の外部キー制約を削除
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'line_patient_linkages_patient_id_fkey'
    AND table_name = 'line_patient_linkages'
  ) THEN
    ALTER TABLE line_patient_linkages DROP CONSTRAINT line_patient_linkages_patient_id_fkey;
  END IF;

  -- カラムの型をTEXTに変更
  ALTER TABLE line_patient_linkages ALTER COLUMN patient_id TYPE TEXT;

  RAISE NOTICE 'line_patient_linkages.patient_id を TEXT 型に変更しました';
END $$;

-- 3. patient_qr_codesテーブルのpatient_idをTEXTに変更
DO $$
BEGIN
  -- 既存の外部キー制約を削除
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'patient_qr_codes_patient_id_fkey'
    AND table_name = 'patient_qr_codes'
  ) THEN
    ALTER TABLE patient_qr_codes DROP CONSTRAINT patient_qr_codes_patient_id_fkey;
  END IF;

  -- カラムの型をTEXTに変更
  ALTER TABLE patient_qr_codes ALTER COLUMN patient_id TYPE TEXT;

  RAISE NOTICE 'patient_qr_codes.patient_id を TEXT 型に変更しました';
END $$;

-- コメント
COMMENT ON COLUMN line_invitation_codes.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
COMMENT ON COLUMN line_patient_linkages.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
COMMENT ON COLUMN patient_qr_codes.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
