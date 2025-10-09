-- 評価・課題管理システムのRLSを無効化（開発環境用）

-- patient_issuesのRLS無効化
ALTER TABLE patient_issues DISABLE ROW LEVEL SECURITY;

-- issue_training_mappingsのRLS無効化
ALTER TABLE issue_training_mappings DISABLE ROW LEVEL SECURITY;

-- patient_issue_recordsのRLS無効化
ALTER TABLE patient_issue_records DISABLE ROW LEVEL SECURITY;

-- training_evaluationsのRLS無効化
ALTER TABLE training_evaluations DISABLE ROW LEVEL SECURITY;

-- evaluation_issue_rulesのRLS無効化
ALTER TABLE evaluation_issue_rules DISABLE ROW LEVEL SECURITY;

-- clinic_training_customizationsのRLS無効化
ALTER TABLE clinic_training_customizations DISABLE ROW LEVEL SECURITY;

-- 確認用メッセージ
DO $$
BEGIN
  RAISE NOTICE 'RLS disabled for evaluation system tables';
  RAISE NOTICE '- patient_issues';
  RAISE NOTICE '- issue_training_mappings';
  RAISE NOTICE '- patient_issue_records';
  RAISE NOTICE '- training_evaluations';
  RAISE NOTICE '- evaluation_issue_rules';
  RAISE NOTICE '- clinic_training_customizations';
END $$;
