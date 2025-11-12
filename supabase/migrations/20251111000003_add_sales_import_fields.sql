-- 売上データに電子カルテ連携用のフィールドを追加

-- 売上テーブルに詳細項目を追加
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50), -- レセプト番号・会計番号
ADD COLUMN IF NOT EXISTS treatment_date DATE, -- 実際の診療日（sale_dateと異なる場合あり）
ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(50), -- 保険種別（社保・国保・後期高齢等）
ADD COLUMN IF NOT EXISTS insurance_points INTEGER, -- 保険点数
ADD COLUMN IF NOT EXISTS insurance_amount INTEGER, -- 保険請求額
ADD COLUMN IF NOT EXISTS patient_copay INTEGER, -- 患者負担額
ADD COLUMN IF NOT EXISTS self_pay_amount INTEGER, -- 自費診療額
ADD COLUMN IF NOT EXISTS total_amount INTEGER, -- 総額
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50), -- 支払方法（現金・クレジット・QR決済等）
ADD COLUMN IF NOT EXISTS treatment_codes TEXT[], -- 診療行為コードの配列
ADD COLUMN IF NOT EXISTS treatment_details JSONB, -- 診療内容の詳細（JSON形式）
ADD COLUMN IF NOT EXISTS notes TEXT, -- 備考
ADD COLUMN IF NOT EXISTS external_system_id VARCHAR(100), -- 外部システムのID
ADD COLUMN IF NOT EXISTS external_system_name VARCHAR(100), -- 外部システム名（Dental X, アポツール等）
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ, -- インポート日時
ADD COLUMN IF NOT EXISTS import_file_name VARCHAR(255); -- インポート元ファイル名

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_sales_receipt_number ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_treatment_date ON sales(treatment_date);
CREATE INDEX IF NOT EXISTS idx_sales_external_system ON sales(external_system_id, external_system_name);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

-- 売上インポート履歴テーブルの作成
CREATE TABLE IF NOT EXISTS sales_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  import_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT,
  total_records INTEGER NOT NULL DEFAULT 0,
  success_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  error_details JSONB, -- エラー詳細
  imported_by UUID REFERENCES staff(id) ON DELETE SET NULL, -- インポート実行者
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_sales_import_history_clinic ON sales_import_history(clinic_id, import_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_import_history_status ON sales_import_history(status);

-- RLS無効化（開発環境）
ALTER TABLE sales_import_history DISABLE ROW LEVEL SECURITY;

-- コメント追加
COMMENT ON COLUMN sales.receipt_number IS 'レセプト番号・会計伝票番号';
COMMENT ON COLUMN sales.treatment_date IS '実際の診療日（会計日と異なる場合あり）';
COMMENT ON COLUMN sales.insurance_type IS '保険種別（社保・国保・後期高齢・自費等）';
COMMENT ON COLUMN sales.insurance_points IS '保険診療点数';
COMMENT ON COLUMN sales.insurance_amount IS '保険請求額（総額）';
COMMENT ON COLUMN sales.patient_copay IS '患者自己負担額（保険診療分）';
COMMENT ON COLUMN sales.self_pay_amount IS '自費診療額';
COMMENT ON COLUMN sales.total_amount IS '合計金額（患者負担額＋自費診療額）';
COMMENT ON COLUMN sales.payment_method IS '支払方法（現金・クレジットカード・QR決済・未収等）';
COMMENT ON COLUMN sales.treatment_codes IS '診療行為コードの配列（レセプト電算コード等）';
COMMENT ON COLUMN sales.treatment_details IS '診療内容の詳細情報（JSON形式で柔軟に格納）';
COMMENT ON COLUMN sales.external_system_id IS '外部電子カルテシステムの売上ID';
COMMENT ON COLUMN sales.external_system_name IS '外部システム名（Dental X、デンタルマップ、アポツール等）';
COMMENT ON TABLE sales_import_history IS '売上データのCSVインポート履歴';
