-- 患者IDをUUIDからTEXTに変更
-- このマイグレーションは、患者IDが実際には "patient_TIMESTAMP_RANDOM" 形式の文字列であるため、
-- すべての関連テーブルのpatient_id列をTEXT型に変更します

-- 1. visual_examinationsテーブルのpatient_idをTEXTに変更
ALTER TABLE visual_examinations
  DROP CONSTRAINT visual_examinations_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

-- 2. periodontal_examinationsテーブルのpatient_idをTEXTに変更
ALTER TABLE periodontal_examinations
  DROP CONSTRAINT periodontal_examinations_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

-- 3. line_invitation_codesテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'line_invitation_codes' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE line_invitation_codes
      DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 4. medical_recordsテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_records' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE medical_records
      DROP CONSTRAINT IF EXISTS medical_records_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 5. oral_function_assessmentsテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'oral_function_assessments' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE oral_function_assessments
      DROP CONSTRAINT IF EXISTS oral_function_assessments_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 6. lip_closure_testsテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lip_closure_tests' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE lip_closure_tests
      DROP CONSTRAINT IF EXISTS lip_closure_tests_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 7. medical_documentsテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_documents' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE medical_documents
      DROP CONSTRAINT IF EXISTS medical_documents_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 8. emr_recordsテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emr_records' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE emr_records
      DROP CONSTRAINT IF EXISTS emr_records_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 9. web_booking_tokensテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'web_booking_tokens' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE web_booking_tokens
      DROP CONSTRAINT IF EXISTS web_booking_tokens_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 10. patient_notification_preferencesテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_notification_preferences' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE patient_notification_preferences
      DROP CONSTRAINT IF EXISTS patient_notification_preferences_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 11. web_booking_patientsテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'web_booking_patients' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE web_booking_patients
      DROP CONSTRAINT IF EXISTS web_booking_patients_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 12. training_patient_actionsテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_patient_actions' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE training_patient_actions
      DROP CONSTRAINT IF EXISTS training_patient_actions_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 13. patient_evaluationsテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_evaluations' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE patient_evaluations
      DROP CONSTRAINT IF EXISTS patient_evaluations_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 14. patient_issuesテーブルのpatient_idをTEXTに変更（テーブルとカラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_issues' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE patient_issues
      DROP CONSTRAINT IF EXISTS patient_issues_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 15. questionnaire_responsesテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questionnaire_responses' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE questionnaire_responses
      DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- 16. subkarte_recordsテーブルのpatient_idをTEXTに変更（カラムが存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subkarte_records' AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE subkarte_records
      DROP CONSTRAINT IF EXISTS subkarte_records_patient_id_fkey,
      ALTER COLUMN patient_id TYPE TEXT;
  END IF;
END $$;

-- コメント
COMMENT ON COLUMN visual_examinations.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
COMMENT ON COLUMN periodontal_examinations.patient_id IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';
