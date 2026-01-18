-- 広告媒体マスターテーブルを作成
CREATE TABLE IF NOT EXISTS ad_sources_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 検索広告, SNS広告, マップ・ローカル, オフライン, オーガニック, その他
  utm_source TEXT NOT NULL,
  utm_medium TEXT,
  description TEXT,
  is_system BOOLEAN DEFAULT false, -- システムデフォルトかどうか
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ad_sources_master_clinic_id ON ad_sources_master(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ad_sources_master_utm_source ON ad_sources_master(utm_source);

-- RLS無効化（開発用）
ALTER TABLE ad_sources_master DISABLE ROW LEVEL SECURITY;

-- デフォルトの広告媒体を挿入（システム共通）
INSERT INTO ad_sources_master (id, clinic_id, name, category, utm_source, utm_medium, description, is_system, sort_order) VALUES
-- 検索広告
(gen_random_uuid(), NULL, 'Google リスティング広告', '検索広告', 'google_ads', 'cpc', 'Google検索結果に表示される広告', true, 1),
(gen_random_uuid(), NULL, 'Yahoo! 検索広告', '検索広告', 'yahoo_ads', 'cpc', 'Yahoo!検索結果に表示される広告', true, 2),

-- マップ・ローカル
(gen_random_uuid(), NULL, 'Google MEO（マップ広告）', 'マップ・ローカル', 'google_meo', 'local', 'Googleマップに表示されるローカル広告', true, 10),
(gen_random_uuid(), NULL, 'Yahoo! ロコ', 'マップ・ローカル', 'yahoo_loco', 'local', 'Yahoo!ロコに表示される広告', true, 11),

-- SNS広告
(gen_random_uuid(), NULL, 'Instagram広告', 'SNS広告', 'instagram', 'social', 'Instagramのフィード・ストーリーズ広告', true, 20),
(gen_random_uuid(), NULL, 'Facebook広告', 'SNS広告', 'facebook', 'social', 'Facebookのフィード広告', true, 21),
(gen_random_uuid(), NULL, 'TikTok広告', 'SNS広告', 'tiktok', 'social', 'TikTokの動画広告', true, 22),
(gen_random_uuid(), NULL, 'LINE広告', 'SNS広告', 'line', 'social', 'LINEのタイムライン・ニュース広告', true, 23),
(gen_random_uuid(), NULL, 'X (Twitter)広告', 'SNS広告', 'twitter', 'social', 'X (Twitter)のプロモーション広告', true, 24),
(gen_random_uuid(), NULL, 'YouTube広告', 'SNS広告', 'youtube', 'video', 'YouTube動画広告', true, 25),

-- オフライン
(gen_random_uuid(), NULL, 'チラシ', 'オフライン', 'chirashi', 'qr', 'チラシのQRコードからの流入', true, 30),
(gen_random_uuid(), NULL, '看板', 'オフライン', 'signboard', 'qr', '看板のQRコードからの流入', true, 31),
(gen_random_uuid(), NULL, '院内紹介カード', 'オフライン', 'referral_card', 'qr', '紹介カードのQRコードからの流入', true, 32),

-- オーガニック
(gen_random_uuid(), NULL, '自然検索（SEO）', 'オーガニック', 'organic', 'search', 'Google/Yahoo等の自然検索からの流入', true, 40),
(gen_random_uuid(), NULL, '直接アクセス', 'オーガニック', 'direct', 'none', 'URLを直接入力しての流入', true, 41),
(gen_random_uuid(), NULL, 'Epark', 'オーガニック', 'epark', 'referral', 'Eparkからの流入', true, 42),
(gen_random_uuid(), NULL, '歯科検索サイト', 'オーガニック', 'dental_portal', 'referral', '歯科ポータルサイトからの流入', true, 43),

-- その他
(gen_random_uuid(), NULL, 'ご紹介', 'その他', 'referral', 'word_of_mouth', '患者様からの紹介', true, 50),
(gen_random_uuid(), NULL, '不明', 'その他', 'unknown', 'none', '流入元が特定できない場合', true, 99)
ON CONFLICT DO NOTHING;

-- 標準問診表の重複質問を削除（来院経路の質問が2つある問題を修正）
-- まず、どちらの質問IDが使われているか確認し、使われていない方を削除
DO $$
DECLARE
  v_questionnaire_id uuid := '11111111-1111-1111-1111-111111111112';
  v_question_ids uuid[];
  v_used_question_id uuid;
  v_delete_question_id uuid;
BEGIN
  -- referral_sourceの質問IDを全て取得
  SELECT array_agg(id ORDER BY created_at) INTO v_question_ids
  FROM questionnaire_questions
  WHERE questionnaire_id = v_questionnaire_id
    AND linked_field = 'referral_source';

  -- 2つ以上ある場合のみ処理
  IF array_length(v_question_ids, 1) > 1 THEN
    -- 回答で使われている質問IDを確認
    SELECT DISTINCT (jsonb_object_keys(response_data))::uuid INTO v_used_question_id
    FROM questionnaire_responses
    WHERE questionnaire_id = v_questionnaire_id
      AND (jsonb_object_keys(response_data))::text = ANY(SELECT unnest(v_question_ids)::text)
    LIMIT 1;

    -- 使われている方を残し、もう一方を削除
    IF v_used_question_id IS NOT NULL THEN
      DELETE FROM questionnaire_questions
      WHERE questionnaire_id = v_questionnaire_id
        AND linked_field = 'referral_source'
        AND id != v_used_question_id;
    ELSE
      -- 回答がない場合は最初の1つを残す
      DELETE FROM questionnaire_questions
      WHERE questionnaire_id = v_questionnaire_id
        AND linked_field = 'referral_source'
        AND id != v_question_ids[1];
    END IF;
  END IF;
END $$;
