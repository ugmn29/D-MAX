-- トラッキングタグ設定テーブル

CREATE TABLE tracking_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Google Tag Manager
  gtm_container_id TEXT,
  gtm_enabled BOOLEAN DEFAULT false,

  -- Google Analytics 4
  ga4_measurement_id TEXT,
  ga4_enabled BOOLEAN DEFAULT false,

  -- Google Ads
  google_ads_conversion_id TEXT,
  google_ads_conversion_label TEXT,
  google_ads_enabled BOOLEAN DEFAULT false,

  -- META Pixel (Facebook/Instagram)
  meta_pixel_id TEXT,
  meta_pixel_enabled BOOLEAN DEFAULT false,

  -- Yahoo広告
  yahoo_ads_account_id TEXT,
  yahoo_ads_enabled BOOLEAN DEFAULT false,

  -- LINE Tag
  line_tag_id TEXT,
  line_tag_enabled BOOLEAN DEFAULT false,

  -- その他のカスタムタグ
  custom_tags JSONB DEFAULT '[]'::jsonb,

  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 1クリニックに1設定のみ
  CONSTRAINT unique_clinic_tracking_tags UNIQUE (clinic_id)
);

-- インデックス
CREATE INDEX idx_tracking_tags_clinic_id ON tracking_tags(clinic_id);

-- RLSポリシー
ALTER TABLE tracking_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tracking_tags_select_policy" ON tracking_tags
  FOR SELECT USING (true);

CREATE POLICY "tracking_tags_insert_policy" ON tracking_tags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tracking_tags_update_policy" ON tracking_tags
  FOR UPDATE USING (true);

CREATE POLICY "tracking_tags_delete_policy" ON tracking_tags
  FOR DELETE USING (true);

-- コメント
COMMENT ON TABLE tracking_tags IS 'トラッキングタグ設定 - GTM, GA4, Google Ads, META Pixelなどの設定を管理';
COMMENT ON COLUMN tracking_tags.gtm_container_id IS 'Google Tag ManagerのコンテナID (GTM-XXXXXXX)';
COMMENT ON COLUMN tracking_tags.ga4_measurement_id IS 'Google Analytics 4の測定ID (G-XXXXXXXXXX)';
COMMENT ON COLUMN tracking_tags.google_ads_conversion_id IS 'Google AdsのコンバージョンID (AW-XXXXXXXXX)';
COMMENT ON COLUMN tracking_tags.google_ads_conversion_label IS 'Google Adsのコンバージョンラベル';
COMMENT ON COLUMN tracking_tags.meta_pixel_id IS 'META Pixel ID (16桁の数字)';
COMMENT ON COLUMN tracking_tags.custom_tags IS 'カスタムタグのJSON配列';
