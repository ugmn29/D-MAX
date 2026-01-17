-- 視診歯牙データのstatusフィールドに'none'と'impacted'を追加
-- 既存の制約を削除して新しい制約を追加

-- まず既存の制約名を確認（通常は visual_tooth_data_status_check のような名前）
-- 制約を削除して再作成
ALTER TABLE visual_tooth_data DROP CONSTRAINT IF EXISTS visual_tooth_data_status_check;

-- 新しい制約を追加（none, impacted を含む）
ALTER TABLE visual_tooth_data
ADD CONSTRAINT visual_tooth_data_status_check
CHECK (status IN (
  'healthy',
  'caries',
  'restoration',
  'missing',
  'extraction_required',
  'unerupted',
  'none',
  'impacted'
));

-- コメント追加
COMMENT ON COLUMN visual_tooth_data.status IS '歯の状態: healthy(健全), caries(う蝕), restoration(補綴), missing(欠損), extraction_required(抜歯必要), unerupted(未萌出), none(なし/存在しない), impacted(埋伏)';
