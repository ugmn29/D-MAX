-- クリニックテーブルにアナリティクス設定カラムを追加

-- HP URL（アナリティクス用）
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS hp_url TEXT;

-- Google Maps API キー（地域分析用）
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS google_maps_api_key TEXT;

-- コメント
COMMENT ON COLUMN clinics.hp_url IS 'ホームページURL（アナリティクスのQRコード・リンク生成用）';
COMMENT ON COLUMN clinics.google_maps_api_key IS 'Google Maps APIキー（地域分析用）';
