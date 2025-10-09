-- Web予約効果測定システム用テーブル

-- 1. 患者獲得経路テーブル
CREATE TABLE patient_acquisition_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- UTMパラメータ
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- デバイス・ブラウザ情報
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  os TEXT,
  browser TEXT,

  -- アンケート回答
  questionnaire_source TEXT,
  questionnaire_detail TEXT,

  -- 最終判定
  final_source TEXT NOT NULL, -- UTMまたはアンケートから確定した流入元
  tracking_method TEXT NOT NULL, -- 'utm' or 'questionnaire'

  -- メタデータ
  first_visit_at TIMESTAMP WITH TIME ZONE,
  booking_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_patient_acquisition_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  CONSTRAINT fk_patient_acquisition_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_patient_acquisition_sources_patient_id ON patient_acquisition_sources(patient_id);
CREATE INDEX idx_patient_acquisition_sources_clinic_id ON patient_acquisition_sources(clinic_id);
CREATE INDEX idx_patient_acquisition_sources_final_source ON patient_acquisition_sources(final_source);
CREATE INDEX idx_patient_acquisition_sources_tracking_method ON patient_acquisition_sources(tracking_method);
CREATE INDEX idx_patient_acquisition_sources_booking_completed_at ON patient_acquisition_sources(booking_completed_at);

-- RLSポリシー
ALTER TABLE patient_acquisition_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_acquisition_sources_select_policy" ON patient_acquisition_sources
  FOR SELECT USING (true);

CREATE POLICY "patient_acquisition_sources_insert_policy" ON patient_acquisition_sources
  FOR INSERT WITH CHECK (true);

CREATE POLICY "patient_acquisition_sources_update_policy" ON patient_acquisition_sources
  FOR UPDATE USING (true);


-- 2. Web予約ファネルイベントテーブル
CREATE TABLE web_booking_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- セッション識別
  session_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- ファネルステップ
  step_name TEXT NOT NULL, -- 'landing', 'date_selection', 'time_selection', 'menu_selection', 'patient_info', 'complete'
  step_number INTEGER NOT NULL, -- 1-6

  -- イベント情報
  event_type TEXT NOT NULL, -- 'page_view', 'button_click', 'form_submit'
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- UTMパラメータ（セッションに紐づく）
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- デバイス情報
  device_type TEXT,

  -- 選択内容のメタデータ（JSON）
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_funnel_events_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_funnel_events_session_id ON web_booking_funnel_events(session_id);
CREATE INDEX idx_funnel_events_clinic_id ON web_booking_funnel_events(clinic_id);
CREATE INDEX idx_funnel_events_step_name ON web_booking_funnel_events(step_name);
CREATE INDEX idx_funnel_events_step_number ON web_booking_funnel_events(step_number);
CREATE INDEX idx_funnel_events_event_timestamp ON web_booking_funnel_events(event_timestamp);
CREATE INDEX idx_funnel_events_utm_source ON web_booking_funnel_events(utm_source);

-- RLSポリシー
ALTER TABLE web_booking_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnel_events_select_policy" ON web_booking_funnel_events
  FOR SELECT USING (true);

CREATE POLICY "funnel_events_insert_policy" ON web_booking_funnel_events
  FOR INSERT WITH CHECK (true);


-- 3. 広告費記録テーブル
CREATE TABLE ad_spend_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- 広告情報
  ad_platform TEXT NOT NULL, -- 'google_ads', 'meta_ads', 'instagram', 'tiktok', etc.
  campaign_name TEXT,

  -- 期間
  spend_date DATE NOT NULL,

  -- 金額
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'JPY',

  -- メタデータ
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_ad_spend_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX idx_ad_spend_clinic_id ON ad_spend_records(clinic_id);
CREATE INDEX idx_ad_spend_platform ON ad_spend_records(ad_platform);
CREATE INDEX idx_ad_spend_date ON ad_spend_records(spend_date);

-- RLSポリシー
ALTER TABLE ad_spend_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_spend_select_policy" ON ad_spend_records
  FOR SELECT USING (true);

CREATE POLICY "ad_spend_insert_policy" ON ad_spend_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ad_spend_update_policy" ON ad_spend_records
  FOR UPDATE USING (true);

CREATE POLICY "ad_spend_delete_policy" ON ad_spend_records
  FOR DELETE USING (true);


-- コメント
COMMENT ON TABLE patient_acquisition_sources IS '患者獲得経路テーブル - UTMパラメータとアンケート回答を統合管理';
COMMENT ON TABLE web_booking_funnel_events IS 'Web予約ファネルイベントテーブル - 予約プロセスの各ステップを記録';
COMMENT ON TABLE ad_spend_records IS '広告費記録テーブル - 各プラットフォームの広告費を管理';
