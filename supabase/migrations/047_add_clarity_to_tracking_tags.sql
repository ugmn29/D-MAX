-- Microsoft Clarity (ヒートマップ) をtracking_tagsテーブルに追加

ALTER TABLE tracking_tags
ADD COLUMN clarity_project_id TEXT,
ADD COLUMN clarity_enabled BOOLEAN DEFAULT false;

-- コメント
COMMENT ON COLUMN tracking_tags.clarity_project_id IS 'Microsoft Clarity Project ID (ヒートマップ・セッションレコーディング)';
COMMENT ON COLUMN tracking_tags.clarity_enabled IS 'Microsoft Clarityが有効かどうか';
