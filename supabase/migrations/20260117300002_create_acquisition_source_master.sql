-- 流入元マスタテーブル（UTMとアンケートの表記揺れを統一）

CREATE TABLE acquisition_source_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- 正規化された流入元名
  normalized_name TEXT NOT NULL,
  display_name TEXT NOT NULL,

  -- カテゴリ（online/offline/referral）
  category TEXT NOT NULL CHECK (category IN ('online', 'offline', 'referral')),

  -- UTMパラメータのバリエーション（これらが来たらnormalized_nameに統一）
  utm_source_patterns TEXT[] DEFAULT '{}',

  -- アンケート回答のバリエーション
  questionnaire_patterns TEXT[] DEFAULT '{}',

  -- 表示順
  sort_order INTEGER DEFAULT 0,

  -- 有効フラグ
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_acquisition_source_master_clinic ON acquisition_source_master(clinic_id);
CREATE INDEX idx_acquisition_source_master_normalized ON acquisition_source_master(normalized_name);

-- RLSポリシー
ALTER TABLE acquisition_source_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acquisition_source_master_select" ON acquisition_source_master
  FOR SELECT USING (true);

CREATE POLICY "acquisition_source_master_insert" ON acquisition_source_master
  FOR INSERT WITH CHECK (true);

CREATE POLICY "acquisition_source_master_update" ON acquisition_source_master
  FOR UPDATE USING (true);

CREATE POLICY "acquisition_source_master_delete" ON acquisition_source_master
  FOR DELETE USING (true);

-- デフォルトの流入元マスタを挿入
INSERT INTO acquisition_source_master (
  clinic_id, normalized_name, display_name, category, utm_source_patterns, questionnaire_patterns, sort_order
) VALUES
  -- オンライン
  ('11111111-1111-1111-1111-111111111111', 'google_search', 'Google検索', 'online',
   ARRAY['google', 'google_search', 'organic'], ARRAY['Google検索', 'グーグル検索', 'Google', 'グーグル'], 1),
  ('11111111-1111-1111-1111-111111111111', 'google_ads', 'Google広告', 'online',
   ARRAY['google_ads', 'google_cpc', 'adwords'], ARRAY['Google広告', 'グーグル広告'], 2),
  ('11111111-1111-1111-1111-111111111111', 'meo', 'MEO（Googleマップ）', 'online',
   ARRAY['meo', 'google_maps', 'googlemaps', 'maps'], ARRAY['MEO', 'Googleマップ', 'グーグルマップ', '地図検索'], 3),
  ('11111111-1111-1111-1111-111111111111', 'instagram', 'Instagram', 'online',
   ARRAY['instagram', 'ig', 'insta'], ARRAY['Instagram', 'インスタグラム', 'インスタ'], 4),
  ('11111111-1111-1111-1111-111111111111', 'facebook', 'Facebook', 'online',
   ARRAY['facebook', 'fb', 'meta'], ARRAY['Facebook', 'フェイスブック', 'FB'], 5),
  ('11111111-1111-1111-1111-111111111111', 'line', 'LINE', 'online',
   ARRAY['line', 'line_ads'], ARRAY['LINE', 'ライン'], 6),
  ('11111111-1111-1111-1111-111111111111', 'youtube', 'YouTube', 'online',
   ARRAY['youtube', 'yt'], ARRAY['YouTube', 'ユーチューブ', 'ようつべ'], 7),
  ('11111111-1111-1111-1111-111111111111', 'tiktok', 'TikTok', 'online',
   ARRAY['tiktok', 'tt'], ARRAY['TikTok', 'ティックトック'], 8),
  ('11111111-1111-1111-1111-111111111111', 'hotpepper', 'ホットペッパー', 'online',
   ARRAY['hotpepper', 'hp_beauty'], ARRAY['ホットペッパー', 'ホトペ', 'HPB'], 9),
  ('11111111-1111-1111-1111-111111111111', 'epark', 'EPARK', 'online',
   ARRAY['epark'], ARRAY['EPARK', 'イーパーク'], 10),

  -- オフライン
  ('11111111-1111-1111-1111-111111111111', 'flyer', 'チラシ', 'offline',
   ARRAY['flyer', 'posting', 'leaflet'], ARRAY['チラシ', 'フライヤー', 'ポスティング'], 20),
  ('11111111-1111-1111-1111-111111111111', 'signboard', '看板', 'offline',
   ARRAY['signboard', 'sign', 'kanban'], ARRAY['看板', '野立て看板', '駅看板'], 21),
  ('11111111-1111-1111-1111-111111111111', 'newspaper', '新聞広告', 'offline',
   ARRAY['newspaper', 'news_ad'], ARRAY['新聞広告', '新聞', '折込チラシ'], 22),
  ('11111111-1111-1111-1111-111111111111', 'magazine', '雑誌広告', 'offline',
   ARRAY['magazine', 'mag_ad'], ARRAY['雑誌広告', '雑誌'], 23),
  ('11111111-1111-1111-1111-111111111111', 'dm', 'ダイレクトメール', 'offline',
   ARRAY['dm', 'direct_mail'], ARRAY['DM', 'ダイレクトメール', 'ハガキ'], 24),
  ('11111111-1111-1111-1111-111111111111', 'nearby', '近所だから', 'offline',
   ARRAY['nearby', 'walk_in'], ARRAY['近所', '近くだから', '通りがかり', '近い'], 25),

  -- 紹介
  ('11111111-1111-1111-1111-111111111111', 'referral_family', '家族・知人紹介', 'referral',
   ARRAY['referral', 'referral_family', 'friend'], ARRAY['知人紹介', '家族紹介', '友人紹介', '紹介'], 30),
  ('11111111-1111-1111-1111-111111111111', 'referral_patient', '患者紹介', 'referral',
   ARRAY['referral_patient', 'patient_referral'], ARRAY['患者紹介', '患者さん紹介'], 31),
  ('11111111-1111-1111-1111-111111111111', 'referral_doctor', '医師紹介', 'referral',
   ARRAY['referral_doctor', 'doctor_referral'], ARRAY['医師紹介', '他院紹介', '先生紹介'], 32);

COMMENT ON TABLE acquisition_source_master IS '流入元マスタ - UTMパラメータとアンケート回答の表記揺れを統一管理';
