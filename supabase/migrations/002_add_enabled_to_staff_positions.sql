-- staff_positionsテーブルにenabledカラムを追加
ALTER TABLE staff_positions ADD COLUMN enabled BOOLEAN DEFAULT true;

-- 既存のデータに対してenabledをtrueに設定
UPDATE staff_positions SET enabled = true WHERE enabled IS NULL;
