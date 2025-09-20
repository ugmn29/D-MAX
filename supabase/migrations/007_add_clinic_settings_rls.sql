-- clinic_settingsテーブルのRLS設定を追加
-- 開発環境ではRLSを無効化する

-- clinic_settingsテーブルにRLSを有効化
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- 開発環境用：RLSを無効化（全アクセス許可）
-- 本番環境では適切なポリシーを設定してください
CREATE POLICY clinic_settings_development_access ON clinic_settings
    FOR ALL TO authenticated
    USING (true);

-- 本番環境用のポリシー（コメントアウト）
-- CREATE POLICY clinic_settings_access ON clinic_settings
--     FOR ALL TO authenticated
--     USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

-- 更新時刻の自動更新トリガーを追加
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON clinic_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
