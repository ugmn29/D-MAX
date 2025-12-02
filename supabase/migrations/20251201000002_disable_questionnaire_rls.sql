-- 問診表関連テーブルのRLSを無効化（開発環境用）
ALTER TABLE questionnaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses DISABLE ROW LEVEL SECURITY;

-- 確認用
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('questionnaires', 'questionnaire_questions', 'questionnaire_responses');
