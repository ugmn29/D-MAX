-- トレーニングテーブルに練習手順と注意事項カラムを追加
-- 作成日: 2025-10-04

-- descriptionを練習手順と注意事項に分離
ALTER TABLE trainings
ADD COLUMN IF NOT EXISTS instructions TEXT[], -- 練習手順（配列）
ADD COLUMN IF NOT EXISTS precautions TEXT[]; -- 注意事項（配列）

-- 既存のdescriptionカラムは残しておく（後方互換性のため）

-- コメント追加
COMMENT ON COLUMN trainings.instructions IS '練習手順（箇条書き配列）';
COMMENT ON COLUMN trainings.precautions IS '注意事項（箇条書き配列）';
COMMENT ON COLUMN trainings.description IS '説明文（旧形式・後方互換性のため残存）';
