-- 本番環境でのテスト用: clinic_settingsテーブルのRLSを一時的に無効化
-- 注意: セキュリティを考慮して、テスト完了後は適切なRLSポリシーを設定してください

-- clinic_settingsテーブルのRLSを無効化
ALTER TABLE clinic_settings DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラーが発生しても続行）
DROP POLICY IF EXISTS clinic_settings_development_access ON clinic_settings;
DROP POLICY IF EXISTS clinic_settings_access ON clinic_settings;
