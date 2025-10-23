-- 全ての問診表の質問をデフォルトで必須に設定

-- システムテンプレートの全質問を必須にする
UPDATE system_questionnaire_template_questions
SET is_required = true
WHERE template_id IN (
  '00000000-0000-0000-0000-000000000001',  -- 標準問診表
  '00000000-0000-0000-0000-000000000002'   -- 習慣チェック表
);
