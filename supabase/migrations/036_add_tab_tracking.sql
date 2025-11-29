-- タブクリックトラッキング用のテーブル拡張

-- 1. web_booking_funnel_eventsテーブルにタブ情報を追加
ALTER TABLE web_booking_funnel_events
ADD COLUMN IF NOT EXISTS tab_id TEXT,
ADD COLUMN IF NOT EXISTS tab_label TEXT,
ADD COLUMN IF NOT EXISTS tab_position TEXT,
ADD COLUMN IF NOT EXISTS referrer_url TEXT;

-- 2. タブクリックイベント専用テーブル
CREATE TABLE IF NOT EXISTS hp_tab_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- セッション情報
  session_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- タブ情報
  tab_id TEXT NOT NULL, -- header, sidebar, footer, price_page, etc.
  tab_label TEXT NOT NULL, -- 「予約する」「今すぐ予約」など
  tab_position TEXT, -- 'header', 'sidebar', 'footer', 'floating'
  page_url TEXT NOT NULL, -- タブがあったページのURL

  -- クリック情報
  click_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- UTMパラメータ（タブクリック時点）
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- デバイス情報
  device_type TEXT,
  os TEXT,
  browser TEXT,

  -- その後の行動
  did_visit_booking BOOLEAN DEFAULT false, -- 予約ページに到達したか
  did_complete_booking BOOLEAN DEFAULT false, -- 予約完了したか
  booking_completed_at TIMESTAMP WITH TIME ZONE,

  -- メタデータ
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_tab_click_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_tab_click_session_id ON hp_tab_click_events(session_id);
CREATE INDEX idx_tab_click_clinic_id ON hp_tab_click_events(clinic_id);
CREATE INDEX idx_tab_click_tab_id ON hp_tab_click_events(tab_id);
CREATE INDEX idx_tab_click_timestamp ON hp_tab_click_events(click_timestamp);
CREATE INDEX idx_tab_click_completed ON hp_tab_click_events(did_complete_booking);

-- RLSポリシー
ALTER TABLE hp_tab_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hp_tab_click_events_select_policy" ON hp_tab_click_events
  FOR SELECT USING (true);

CREATE POLICY "hp_tab_click_events_insert_policy" ON hp_tab_click_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "hp_tab_click_events_update_policy" ON hp_tab_click_events
  FOR UPDATE USING (true);

-- 3. 患者獲得経路テーブルにタブ情報を追加
ALTER TABLE patient_acquisition_sources
ADD COLUMN IF NOT EXISTS clicked_tab_id TEXT,
ADD COLUMN IF NOT EXISTS clicked_tab_label TEXT;

-- コメント
COMMENT ON TABLE hp_tab_click_events IS 'HPのタブクリックイベントテーブル - どのタブから予約に流入したかを記録';
COMMENT ON COLUMN hp_tab_click_events.tab_id IS 'タブの識別子（header, sidebar, footer, price_pageなど）';
COMMENT ON COLUMN hp_tab_click_events.tab_label IS 'タブのラベル（「予約する」「今すぐ予約」など）';
COMMENT ON COLUMN hp_tab_click_events.tab_position IS 'タブの配置位置（header, sidebar, footer, floating）';
COMMENT ON COLUMN hp_tab_click_events.did_visit_booking IS '予約ページに到達したか';
COMMENT ON COLUMN hp_tab_click_events.did_complete_booking IS '予約を完了したか';

COMMENT ON COLUMN web_booking_funnel_events.tab_id IS 'クリックされたタブのID';
COMMENT ON COLUMN web_booking_funnel_events.tab_label IS 'クリックされたタブのラベル';
COMMENT ON COLUMN web_booking_funnel_events.referrer_url IS '参照元URL';

COMMENT ON COLUMN patient_acquisition_sources.clicked_tab_id IS '最初にクリックされたタブのID';
COMMENT ON COLUMN patient_acquisition_sources.clicked_tab_label IS '最初にクリックされたタブのラベル';
