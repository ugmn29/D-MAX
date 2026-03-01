-- system_* テーブルのRLSを無効化（全ユーザーが読み取り可能にする）
ALTER TABLE system_questionnaire_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_questionnaire_template_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_notification_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_cancel_reasons DISABLE ROW LEVEL SECURITY;
