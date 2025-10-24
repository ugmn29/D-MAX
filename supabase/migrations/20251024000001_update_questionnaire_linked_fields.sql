-- Update questionnaire template questions with linked fields and fix hospital question text

-- 氏名項目のlinked_field設定を追加（患者詳細情報と連携）
UPDATE system_questionnaire_template_questions
SET linked_field = 'name'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '基本情報'
AND question_text = '氏名'
AND sort_order = 2;

-- フリガナ項目のlinked_field設定を追加（患者詳細情報と連携）
UPDATE system_questionnaire_template_questions
SET linked_field = 'furigana_kana'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '基本情報'
AND question_text = 'フリガナ'
AND sort_order = 3;

-- 通院中の病院・病名の質問文を修正（病院名を明記）
UPDATE system_questionnaire_template_questions
SET question_text = '通院中の病院・病名（病院名も記載してください）'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text = '通院中の病院'
AND sort_order = 209;
