-- 質問に is_hidden カラムを追加
-- 編集モードで目のアイコンを押すと質問を非表示にできる機能のため

ALTER TABLE questionnaire_questions
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN questionnaire_questions.is_hidden IS '質問を問診票で非表示にするかどうか';
