-- treatment_menusテーブルのRLSポリシーを修正
-- 開発環境でのアクセスを許可する

-- 既存のポリシーを削除
DROP POLICY IF EXISTS treatment_menus_development_access ON treatment_menus;

-- 新しいポリシーを作成（認証なしでもアクセス可能）
CREATE POLICY treatment_menus_allow_all ON treatment_menus
    FOR ALL
    USING (true)
    WITH CHECK (true);
