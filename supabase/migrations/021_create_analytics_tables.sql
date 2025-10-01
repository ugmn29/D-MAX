-- 経営分析機能用テーブルの作成

-- 売上テーブル（会計完了時点で記録）
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  sale_date DATE NOT NULL,
  amount INTEGER NOT NULL, -- 売上金額（円）
  category VARCHAR(50) NOT NULL CHECK (category IN ('insurance', 'self_pay')), -- 保険診療 or 自費診療
  treatment_menu_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 広告費用管理テーブル
CREATE TABLE IF NOT EXISTS advertising_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('google', 'meta', 'yahoo', 'instagram', 'other')),
  cost INTEGER NOT NULL, -- 広告費用（円）
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 患者流入経路テーブル
CREATE TABLE IF NOT EXISTS patient_acquisition_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  acquisition_channel VARCHAR(100) NOT NULL, -- 'web_booking', 'referral', 'walk_in', 'google_ads', 'facebook_ads', etc.
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  referral_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL, -- 紹介患者の場合
  acquisition_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スタッフ評価指標設定テーブル
CREATE TABLE IF NOT EXISTS staff_evaluation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('sales_per_hour', 'recall_rate', 'self_pay_rate', 'cancellation_rate', 'satisfaction', 'patient_count')),
  weight_percentage INTEGER NOT NULL DEFAULT 0 CHECK (weight_percentage >= 0 AND weight_percentage <= 100), -- 重要度（％）
  target_value DECIMAL(10,2),
  position_id UUID REFERENCES staff_positions(id) ON DELETE SET NULL, -- 役職別基準
  evaluation_period VARCHAR(20) DEFAULT 'monthly' CHECK (evaluation_period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スタッフ評価結果テーブル
CREATE TABLE IF NOT EXISTS staff_evaluation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  evaluation_period_start DATE NOT NULL,
  evaluation_period_end DATE NOT NULL,
  metrics_data JSONB NOT NULL, -- 各指標の実績値
  total_score DECIMAL(10,2),
  bonus_amount INTEGER DEFAULT 0, -- 歩合給金額（円）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_sales_clinic_date ON sales(clinic_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_staff ON sales(staff_id);
CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);
CREATE INDEX IF NOT EXISTS idx_advertising_costs_clinic_period ON advertising_costs(clinic_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_patient_acquisition_clinic_date ON patient_acquisition_channels(clinic_id, acquisition_date);
CREATE INDEX IF NOT EXISTS idx_staff_evaluation_settings_clinic ON staff_evaluation_settings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_staff_evaluation_results_staff_period ON staff_evaluation_results(staff_id, evaluation_period_start, evaluation_period_end);

-- RLSポリシー（開発環境では無効化）
-- 本番環境では適切なRLSポリシーを設定する必要があります
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE advertising_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_acquisition_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_evaluation_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_evaluation_results DISABLE ROW LEVEL SECURITY;
