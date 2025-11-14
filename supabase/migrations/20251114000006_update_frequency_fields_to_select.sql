-- 1日の喫煙本数と1日の歯磨き回数をセレクトボックスに変更

-- システムテンプレートの「1日の喫煙本数」をselectタイプに変更
UPDATE system_questionnaire_template_questions
SET
  question_type = 'select',
  options = '["0本", "1-5本", "6-10本", "11-20本", "21-30本", "31本以上"]'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND question_text = '1日の喫煙本数';

-- システムテンプレートの「1日の歯磨き回数」をselectタイプに変更
UPDATE system_questionnaire_template_questions
SET
  question_type = 'select',
  options = '["0回", "1回", "2回", "3回", "4回以上"]'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND question_text = '1日の歯磨き回数';

-- 既存の問診票の「1日の喫煙本数」をselectタイプに変更
UPDATE questionnaire_questions
SET
  question_type = 'select',
  options = '["0本", "1-5本", "6-10本", "11-20本", "21-30本", "31本以上"]'
WHERE question_text = '1日の喫煙本数';

-- 既存の問診票の「1日の歯磨き回数」をselectタイプに変更
UPDATE questionnaire_questions
SET
  question_type = 'select',
  options = '["0回", "1回", "2回", "3回", "4回以上"]'
WHERE question_text = '1日の歯磨き回数';
