-- ========================================
-- 電子カルテ (EMR) システム - データベーススキーマ
-- Electronic Medical Record System - Database Schema
-- 作成日: 2025-11-12
-- ========================================

-- ========================================
-- Part 1: マスターデータテーブル
-- Master Data Tables
-- ========================================

-- 診療行為マスター (Treatment Codes Master)
CREATE TABLE IF NOT EXISTS treatment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- 9桁診療行為コード + 5桁加算コード
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  inclusion_rules TEXT[] DEFAULT '{}', -- 包括される処置コード配列
  exclusion_rules JSONB DEFAULT '{"same_day":[],"same_month":[],"simultaneous":[],"same_site":[],"same_week":[]}'::jsonb,
  frequency_limits JSONB DEFAULT '[]'::jsonb, -- [{"period":"day|week|month|year","max_count":number}]
  effective_from DATE NOT NULL,
  effective_to DATE,
  requires_documents TEXT[] DEFAULT '{}', -- 必須文書コード
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_treatment_codes_code ON treatment_codes(code);
CREATE INDEX IF NOT EXISTS idx_treatment_codes_effective_dates ON treatment_codes(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_treatment_codes_name ON treatment_codes(name);
CREATE INDEX IF NOT EXISTS idx_treatment_codes_category ON treatment_codes(category);

COMMENT ON TABLE treatment_codes IS '診療行為マスター - 厚生労働省診療報酬点数表データ';
COMMENT ON COLUMN treatment_codes.code IS '診療行為コード (9桁) + 加算コード (5桁)';
COMMENT ON COLUMN treatment_codes.inclusion_rules IS '包括される処置コード配列';
COMMENT ON COLUMN treatment_codes.exclusion_rules IS '背反ルール: {same_day, same_month, simultaneous, same_site, same_week}';
COMMENT ON COLUMN treatment_codes.frequency_limits IS '算定回数制限: [{"period":"day","max_count":1}]';
COMMENT ON COLUMN treatment_codes.requires_documents IS '必須医療文書コード (例: ["歯科疾患管理料"])';

-- ========================================

-- 病名マスター (Disease Codes Master)
CREATE TABLE IF NOT EXISTS disease_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kana TEXT NOT NULL,
  icd10_code TEXT NOT NULL,
  category TEXT NOT NULL,
  is_dental BOOLEAN DEFAULT true,
  synonyms TEXT[] DEFAULT '{}',
  effective_from DATE NOT NULL,
  effective_to DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_disease_codes_code ON disease_codes(code);
CREATE INDEX IF NOT EXISTS idx_disease_codes_name ON disease_codes(name);
CREATE INDEX IF NOT EXISTS idx_disease_codes_kana ON disease_codes(kana);
CREATE INDEX IF NOT EXISTS idx_disease_codes_icd10 ON disease_codes(icd10_code);
CREATE INDEX IF NOT EXISTS idx_disease_codes_category ON disease_codes(category);
CREATE INDEX IF NOT EXISTS idx_disease_codes_is_dental ON disease_codes(is_dental);

COMMENT ON TABLE disease_codes IS '病名マスター - MEDIS-DC ICD10対応標準病名マスター';
COMMENT ON COLUMN disease_codes.kana IS 'カナ読み (検索用)';
COMMENT ON COLUMN disease_codes.synonyms IS '同義語配列';

-- ========================================

-- 医薬品マスター (Medicine Codes Master)
CREATE TABLE IF NOT EXISTS medicine_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  unit TEXT NOT NULL, -- 錠、mL等
  price_per_unit DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  prescription_required BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL,
  effective_to DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_medicine_codes_code ON medicine_codes(code);
CREATE INDEX IF NOT EXISTS idx_medicine_codes_name ON medicine_codes(name);
CREATE INDEX IF NOT EXISTS idx_medicine_codes_generic_name ON medicine_codes(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicine_codes_category ON medicine_codes(category);

COMMENT ON TABLE medicine_codes IS '医薬品マスター - 厚生労働省医薬品マスター';
COMMENT ON COLUMN medicine_codes.price_per_unit IS '薬価 (単位あたり価格)';

-- ========================================

-- 自費診療マスター (Self-Pay Treatment Master)
CREATE TABLE IF NOT EXISTS self_pay_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(3,2) DEFAULT 0.10, -- 消費税率
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, code)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_self_pay_treatments_clinic_id ON self_pay_treatments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_self_pay_treatments_category ON self_pay_treatments(category);
CREATE INDEX IF NOT EXISTS idx_self_pay_treatments_is_active ON self_pay_treatments(is_active);

COMMENT ON TABLE self_pay_treatments IS '自費診療マスター - クリニック独自の自費診療料金';
COMMENT ON COLUMN self_pay_treatments.tax_rate IS '消費税率 (0.10 = 10%)';

-- ========================================

-- 施設マスター (Facility Master - 訪問診療先)
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 介護老人保健施設、特別養護老人ホーム等
  postal_code TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, code)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_facilities_clinic_id ON facilities(clinic_id);
CREATE INDEX IF NOT EXISTS idx_facilities_is_active ON facilities(is_active);

COMMENT ON TABLE facilities IS '施設マスター - 訪問診療先施設情報';

-- ========================================

-- 技工所マスター (Dental Laboratory Master)
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  postal_code TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_labs_clinic_id ON labs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_labs_is_active ON labs(is_active);

COMMENT ON TABLE labs IS '技工所マスター';

-- ========================================
-- Part 2: 診療記録テーブル
-- Medical Record Tables
-- ========================================

-- 診療記録 (Medical Record)
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('initial', 'regular', 'emergency', 'home_visit')),
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,

  -- 病名情報
  diseases JSONB DEFAULT '[]'::jsonb, -- [{disease_code_id, onset_date, is_primary, status, notes}]

  -- 診療内容
  treatments JSONB DEFAULT '[]'::jsonb, -- [{treatment_code_id, tooth_numbers[], quantity, points, notes, operator_id}]

  -- 処方
  prescriptions JSONB DEFAULT '[]'::jsonb, -- [{medicine_code_id, quantity, dosage, days, notes}]

  -- 自費診療
  self_pay_items JSONB DEFAULT '[]'::jsonb, -- [{self_pay_treatment_id, quantity, unit_price, subtotal, tax, total, notes}]

  -- 計算結果
  total_points INTEGER DEFAULT 0,
  total_insurance_amount DECIMAL(10,2) DEFAULT 0,
  patient_copay_amount DECIMAL(10,2) DEFAULT 0,
  self_pay_amount DECIMAL(10,2) DEFAULT 0,

  -- SOAP記録
  subjective TEXT DEFAULT '',
  objective TEXT DEFAULT '',
  assessment TEXT DEFAULT '',
  plan TEXT DEFAULT '',

  -- 関連情報
  related_document_ids TEXT[] DEFAULT '{}',
  treatment_plan_id UUID,
  receipt_id UUID,

  -- メタデータ
  created_by UUID NOT NULL REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES staff(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 監査ログ
  version INTEGER DEFAULT 1,
  snapshot_data JSONB DEFAULT '{}'::jsonb -- 診療時点のマスターデータスナップショット
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_clinic_id ON medical_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_type ON medical_records(visit_type);
CREATE INDEX IF NOT EXISTS idx_medical_records_facility_id ON medical_records(facility_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_treatment_plan_id ON medical_records(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON medical_records(created_at DESC);

COMMENT ON TABLE medical_records IS '診療記録 - 電子カルテの中核テーブル';
COMMENT ON COLUMN medical_records.diseases IS '病名情報 JSONB配列';
COMMENT ON COLUMN medical_records.treatments IS '診療行為情報 JSONB配列';
COMMENT ON COLUMN medical_records.snapshot_data IS '診療時点の点数表バージョンスナップショット';

-- ========================================

-- 治療計画 (Treatment Plan)
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),

  -- 計画内容
  planned_treatments JSONB DEFAULT '[]'::jsonb, -- [{treatment_code_id, tooth_numbers[], sequence, estimated_date, completed_date, medical_record_id, notes}]

  -- 見積もり
  estimated_total_points INTEGER DEFAULT 0,
  estimated_insurance_amount DECIMAL(10,2) DEFAULT 0,
  estimated_patient_amount DECIMAL(10,2) DEFAULT 0,
  estimated_self_pay_amount DECIMAL(10,2) DEFAULT 0,

  -- メタデータ
  created_by UUID NOT NULL REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID NOT NULL REFERENCES staff(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinic_id ON treatment_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_created_at ON treatment_plans(created_at DESC);

COMMENT ON TABLE treatment_plans IS '治療計画';

-- ========================================

-- レセプト (Receipt / Medical Claim)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- 'YYYY-MM'

  -- 医療記録
  medical_record_ids TEXT[] DEFAULT '{}',

  -- 計算結果
  total_points INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0, -- 点数 × 10円
  insurance_amount DECIMAL(10,2) DEFAULT 0, -- 保険者負担額
  patient_amount DECIMAL(10,2) DEFAULT 0, -- 患者負担額

  -- レセプト情報
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'submitted', 'approved', 'rejected', 'resubmitted')),
  validation_errors JSONB DEFAULT '[]'::jsonb, -- [{rule_id, severity, message, field}]

  -- 提出情報
  submitted_at TIMESTAMPTZ,
  submission_file_path TEXT,
  receipt_number TEXT,

  -- 審査結果
  audit_result JSONB, -- {status, reduced_amount, rejection_reason, inquiry_details, response_details, response_submitted_at}

  -- メタデータ
  created_by UUID NOT NULL REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(clinic_id, patient_id, year_month)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_receipts_clinic_id ON receipts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_receipts_patient_id ON receipts(patient_id);
CREATE INDEX IF NOT EXISTS idx_receipts_year_month ON receipts(year_month DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_submitted_at ON receipts(submitted_at DESC);

COMMENT ON TABLE receipts IS 'レセプト (診療報酬明細書)';
COMMENT ON COLUMN receipts.year_month IS '診療年月 (YYYY-MM形式)';
COMMENT ON COLUMN receipts.validation_errors IS '検証エラー配列';

-- ========================================

-- 技工指示書 (Lab Order)
CREATE TABLE IF NOT EXISTS lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE RESTRICT,

  order_date DATE NOT NULL,
  due_date DATE NOT NULL,
  completed_date DATE,

  -- 指示内容
  items JSONB DEFAULT '[]'::jsonb, -- [{type, tooth_numbers[], material, shade, instructions, price}]

  total_cost DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'in_progress', 'completed', 'delivered')),

  -- メタデータ
  created_by UUID NOT NULL REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_lab_orders_clinic_id ON lab_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_lab_id ON lab_orders(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_medical_record_id ON lab_orders(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_order_date ON lab_orders(order_date DESC);

COMMENT ON TABLE lab_orders IS '技工指示書';

-- ========================================
-- Part 3: 既存テーブル拡張
-- Extend Existing Tables
-- ========================================

-- patients テーブルに保険関連カラム追加
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_card_image_path TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_verification_status TEXT DEFAULT 'unverified' CHECK (insurance_verification_status IN ('unverified', 'verified', 'expired'));
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_insurance_verification_date TIMESTAMPTZ;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS copay_rate DECIMAL(3,2) DEFAULT 0.30; -- 患者負担割合 (0.10, 0.20, 0.30等)

COMMENT ON COLUMN patients.insurance_card_image_path IS '保険証画像パス (Supabase Storage)';
COMMENT ON COLUMN patients.insurance_verification_status IS 'オンライン資格確認ステータス';
COMMENT ON COLUMN patients.copay_rate IS '患者負担割合 (0.30 = 30%)';

-- medical_documents テーブルに診療記録連携カラム追加
ALTER TABLE medical_documents ADD COLUMN IF NOT EXISTS medical_record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL;
ALTER TABLE medical_documents ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;
ALTER TABLE medical_documents ADD COLUMN IF NOT EXISTS template_id TEXT;

CREATE INDEX IF NOT EXISTS idx_medical_documents_medical_record_id ON medical_documents(medical_record_id);

COMMENT ON COLUMN medical_documents.medical_record_id IS '関連診療記録ID';
COMMENT ON COLUMN medical_documents.auto_generated IS '自動生成フラグ';
COMMENT ON COLUMN medical_documents.template_id IS 'テンプレートID';

-- ========================================
-- Part 4: Row Level Security (RLS) ポリシー
-- Row Level Security Policies
-- ========================================

-- 開発環境のため、すべてのテーブルでRLSを一時的に無効化
-- 本番環境では適切なRLSポリシーを設定してください

ALTER TABLE treatment_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE disease_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE self_pay_treatments DISABLE ROW LEVEL SECURITY;
ALTER TABLE facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE labs DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders DISABLE ROW LEVEL SECURITY;

-- ========================================
-- Part 5: 外部キー制約追加（テーブル作成後）
-- Add Foreign Key Constraints After Table Creation
-- ========================================

-- medical_recordsテーブルにtreatment_plansへの外部キー制約を追加
ALTER TABLE medical_records
  ADD CONSTRAINT fk_medical_records_treatment_plan
  FOREIGN KEY (treatment_plan_id)
  REFERENCES treatment_plans(id)
  ON DELETE SET NULL;

-- ========================================
-- Part 6: トリガー設定
-- Triggers
-- ========================================

-- updated_at 自動更新トリガー関数 (既存の関数を再利用)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_treatment_codes_updated_at BEFORE UPDATE ON treatment_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disease_codes_updated_at BEFORE UPDATE ON disease_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicine_codes_updated_at BEFORE UPDATE ON medicine_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_self_pay_treatments_updated_at BEFORE UPDATE ON self_pay_treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_labs_updated_at BEFORE UPDATE ON labs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON lab_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Part 7: 初期データ
-- Seed Data
-- ========================================

-- (Phase 1実装時に、実際のCSVデータから取込)

-- ========================================
-- 完了
-- Migration Complete
-- ========================================

COMMENT ON SCHEMA public IS '電子カルテシステム - マイグレーション完了 (2025-11-12)';
