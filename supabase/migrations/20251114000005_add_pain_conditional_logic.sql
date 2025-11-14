-- 痛みに関する質問に条件付きロジックを追加
-- 「痛む箇所」で「現在は痛みはない」が選択されていない場合のみ、「いつから痛みますか」と「痛み方は」を表示

-- システムテンプレートの「いつから痛みますか」に条件付きロジックを追加
UPDATE system_questionnaire_template_questions
SET conditional_logic = jsonb_build_object(
  'show_when', jsonb_build_object(
    'question_text', '痛む箇所（複数選択可）',
    'value', '現在は痛みはない',
    'operator', 'not_contains'
  )
)
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND question_text = 'いつから痛みますか';

-- システムテンプレートの「痛み方は（複数選択可）」に条件付きロジックを追加
UPDATE system_questionnaire_template_questions
SET conditional_logic = jsonb_build_object(
  'show_when', jsonb_build_object(
    'question_text', '痛む箇所（複数選択可）',
    'value', '現在は痛みはない',
    'operator', 'not_contains'
  )
)
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND question_text = '痛み方は（複数選択可）';

-- 既存の問診票の「いつから痛みますか」に条件付きロジックを追加
UPDATE questionnaire_questions
SET conditional_logic = jsonb_build_object(
  'show_when', jsonb_build_object(
    'question_text', '痛む箇所（複数選択可）',
    'value', '現在は痛みはない',
    'operator', 'not_contains'
  )
)
WHERE question_text = 'いつから痛みますか';

-- 既存の問診票の「痛み方は（複数選択可）」に条件付きロジックを追加
UPDATE questionnaire_questions
SET conditional_logic = jsonb_build_object(
  'show_when', jsonb_build_object(
    'question_text', '痛む箇所（複数選択可）',
    'value', '現在は痛みはない',
    'operator', 'not_contains'
  )
)
WHERE question_text = '痛み方は（複数選択可）';
