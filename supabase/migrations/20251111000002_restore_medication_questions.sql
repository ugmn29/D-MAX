-- 標準問診票に服用薬関連の質問を復元

-- まず既存の服用薬関連の質問を削除（重複を避けるため）
DELETE FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text IN ('服用中のお薬', '服用中の薬剤名');

-- 服用中のお薬の質問を追加
INSERT INTO system_questionnaire_template_questions (
  template_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  linked_field
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '健康状態',
  '服用中のお薬',
  'radio',
  '["ない", "ある"]',
  true,
  210,
  'medications'
);

-- 服用中の薬剤名の詳細入力欄を追加
INSERT INTO system_questionnaire_template_questions (
  template_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  linked_field
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '健康状態',
  '服用中の薬剤名',
  'textarea',
  NULL,
  true,
  211,
  'medications'
);
