-- 開発環境用: RLSを無効化
-- 本番環境では適切なRLSポリシーを設定してください

-- staffテーブルのRLSを無効化
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- staff_positionsテーブルのRLSを無効化  
ALTER TABLE staff_positions DISABLE ROW LEVEL SECURITY;

-- clinicsテーブルのRLSを無効化
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
