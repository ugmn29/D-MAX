-- system_questionnaire_template_questionsテーブルにlinked_fieldカラムを追加
ALTER TABLE system_questionnaire_template_questions
ADD COLUMN IF NOT EXISTS linked_field TEXT;

COMMENT ON COLUMN system_questionnaire_template_questions.linked_field IS '患者情報フィールドとの連携設定（例: last_name, email, allergies）';

-- Q13: 希望連絡先を標準問診表に追加
INSERT INTO system_questionnaire_template_questions (
  id,
  template_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  linked_field
) VALUES (
  '3f8e9c1d-5b2a-4d7e-9f1c-8a3b6e4d2c1a'::uuid,
  '00000000-0000-0000-0000-000000000001',
  '基本情報',
  '希望連絡先',
  'radio',
  '["LINE", "メール", "SMS", "指定なし"]'::jsonb,
  false,
  13,
  'preferred_contact_method'
);
