-- 問診表関連テーブルのRLSを無効化（開発環境用）
ALTER TABLE questionnaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses DISABLE ROW LEVEL SECURITY;
