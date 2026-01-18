-- 簡易問診表をクリニックに追加
-- system_questionnaire_templatesからコピー

-- 簡易問診表を挿入（既に存在する場合はスキップ）
INSERT INTO questionnaires (id, clinic_id, name, description, is_active, created_at, updated_at)
SELECT
  '11111111-1111-1111-1111-111111111114'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  name,
  description,
  is_active,
  NOW(),
  NOW()
FROM system_questionnaire_templates
WHERE id = '00000000-0000-0000-0000-000000000003'
ON CONFLICT (id) DO NOTHING;

-- 簡易問診表の質問をコピー
INSERT INTO questionnaire_questions (
  questionnaire_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  conditional_logic,
  sort_order,
  linked_field,
  created_at,
  updated_at
)
SELECT
  '11111111-1111-1111-1111-111111111114'::uuid,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  conditional_logic,
  sort_order,
  linked_field,
  NOW(),
  NOW()
FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000003'
ON CONFLICT DO NOTHING;
