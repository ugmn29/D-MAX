-- daily_memosテーブルのRLS設定を追加
-- 開発環境ではRLSを無効化する

-- daily_memosテーブルにRLSを有効化
ALTER TABLE daily_memos ENABLE ROW LEVEL SECURITY;

-- 開発環境用：RLSを無効化（全アクセス許可）
-- 本番環境では適切なポリシーを設定してください
CREATE POLICY daily_memos_development_access ON daily_memos
    FOR ALL TO authenticated
    USING (true);

-- 本番環境用のポリシー（コメントアウト）
-- CREATE POLICY daily_memos_access ON daily_memos
--     FOR ALL TO authenticated
--     USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);
