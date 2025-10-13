-- 視診歯牙データのINSERTポリシーを修正
-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "Users can insert visual tooth data to their clinic" ON visual_tooth_data;

-- 新しいINSERTポリシー: examination_idの存在チェックを削除し、直接検査テーブルのclinic_idをチェック
-- これにより、同じトランザクション内で作成された検査レコードにも歯牙データを挿入可能
CREATE POLICY "Users can insert visual tooth data to their clinic"
  ON visual_tooth_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visual_examinations
      WHERE id = examination_id
      AND clinic_id IN (
        SELECT clinic_id FROM staff WHERE user_id = auth.uid()
      )
    )
  );
