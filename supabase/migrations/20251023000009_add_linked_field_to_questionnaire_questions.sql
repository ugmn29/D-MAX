-- questionnaire_questionsテーブルにlinked_fieldカラムを追加
ALTER TABLE questionnaire_questions
ADD COLUMN IF NOT EXISTS linked_field TEXT;

COMMENT ON COLUMN questionnaire_questions.linked_field IS '患者情報フィールドとの連携設定（例: last_name, email, allergies）';
