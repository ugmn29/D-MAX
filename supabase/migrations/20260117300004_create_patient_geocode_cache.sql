-- 患者住所のジオコーディングキャッシュテーブル

CREATE TABLE patient_geocode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- 元の住所情報
  original_address TEXT NOT NULL,
  prefecture TEXT,
  city TEXT,
  district TEXT, -- 区・町

  -- ジオコーディング結果
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geocode_status TEXT CHECK (geocode_status IN ('success', 'failed', 'pending')),
  geocode_error TEXT,

  -- 地域分析用
  area_code TEXT, -- 地域コード（市区町村コード等）
  distance_from_clinic DECIMAL(10, 2), -- クリニックからの距離（km）

  -- キャッシュ管理
  geocoded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(patient_id)
);

-- インデックス
CREATE INDEX idx_geocode_cache_clinic ON patient_geocode_cache(clinic_id);
CREATE INDEX idx_geocode_cache_status ON patient_geocode_cache(geocode_status);
CREATE INDEX idx_geocode_cache_prefecture ON patient_geocode_cache(prefecture);
CREATE INDEX idx_geocode_cache_city ON patient_geocode_cache(city);
CREATE INDEX idx_geocode_cache_lat_lng ON patient_geocode_cache(latitude, longitude);

-- RLSポリシー
ALTER TABLE patient_geocode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "geocode_cache_select" ON patient_geocode_cache
  FOR SELECT USING (true);

CREATE POLICY "geocode_cache_insert" ON patient_geocode_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "geocode_cache_update" ON patient_geocode_cache
  FOR UPDATE USING (true);

-- 地域別集計ビュー
CREATE OR REPLACE VIEW patient_area_summary AS
SELECT
  gc.clinic_id,
  gc.prefecture,
  gc.city,
  gc.district,
  COUNT(DISTINCT gc.patient_id) as patient_count,
  AVG(gc.distance_from_clinic) as avg_distance_km
FROM patient_geocode_cache gc
WHERE gc.geocode_status = 'success'
GROUP BY gc.clinic_id, gc.prefecture, gc.city, gc.district;

COMMENT ON TABLE patient_geocode_cache IS '患者住所のジオコーディングキャッシュ - Google Maps API結果を保存';
COMMENT ON VIEW patient_area_summary IS '地域別患者数集計ビュー';
