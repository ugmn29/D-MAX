-- questionnaire_responsesテーブルにpatient_idの外部キー制約を追加

-- 既存の制約を削除（存在する場合）
ALTER TABLE questionnaire_responses
DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;

-- 外部キー制約を追加
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
