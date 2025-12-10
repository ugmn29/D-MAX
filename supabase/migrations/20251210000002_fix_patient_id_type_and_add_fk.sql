-- questionnaire_responses.patient_idの型をtextからuuidに変更してから外部キーを追加

-- ステップ1: patient_idカラムの型をUUIDに変更
-- まず、既存のtext値をUUIDに変換できるか確認
-- NULLや無効な値は保持
ALTER TABLE questionnaire_responses
ALTER COLUMN patient_id TYPE uuid
USING (
  CASE
    WHEN patient_id IS NULL THEN NULL
    WHEN patient_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN patient_id::uuid
    ELSE NULL
  END
);

-- ステップ2: 外部キー制約を追加
ALTER TABLE questionnaire_responses
DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;

ALTER TABLE questionnaire_responses
ADD CONSTRAINT questionnaire_responses_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES patients(id)
ON DELETE SET NULL;

-- 確認
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'questionnaire_responses'
  AND tc.constraint_type = 'FOREIGN KEY';
