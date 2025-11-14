-- アレルギー詳細フィールドにプレースホルダーを追加

-- placeholderカラムが存在しない場合は追加
ALTER TABLE system_questionnaire_template_questions
ADD COLUMN IF NOT EXISTS placeholder TEXT;

ALTER TABLE questionnaire_questions
ADD COLUMN IF NOT EXISTS placeholder TEXT;

-- システムテンプレートのアレルギー詳細にプレースホルダーを追加
UPDATE system_questionnaire_template_questions
SET placeholder = '該当しない場合は、なしと記入してください'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND question_text = 'アレルギーの詳細';

-- 既存の問診票のアレルギー詳細にもプレースホルダーを追加
UPDATE questionnaire_questions
SET placeholder = '該当しない場合は、なしと記入してください'
WHERE question_text = 'アレルギーの詳細';
