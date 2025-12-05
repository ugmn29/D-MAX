-- 処置セットマスタテーブル
-- Treatment Sets Master Table
CREATE TABLE IF NOT EXISTS treatment_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- セット名（例：「抜髄セット」）
  code TEXT UNIQUE NOT NULL, -- セットコード（例：「SET_PULPECTOMY」）
  description TEXT, -- 説明
  category TEXT, -- カテゴリ（例：「歯内療法」「充填」など）
  display_order INTEGER DEFAULT 0, -- 表示順序
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 処置セットの構成要素テーブル
-- Treatment Set Items Table
CREATE TABLE IF NOT EXISTS treatment_set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES treatment_sets(id) ON DELETE CASCADE,
  treatment_code TEXT NOT NULL, -- treatment_codes.code を参照
  is_required BOOLEAN DEFAULT true, -- 必須項目かどうか
  display_order INTEGER DEFAULT 0,
  default_selected BOOLEAN DEFAULT true, -- デフォルトで選択状態
  notes TEXT, -- この項目に関する注記
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 処置の必須記載項目定義テーブル
-- Required Documentation Fields for Treatments
CREATE TABLE IF NOT EXISTS treatment_required_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_code TEXT NOT NULL, -- treatment_codes.code を参照
  field_name TEXT NOT NULL, -- フィールド名（例：「抜歯理由」「根管数」）
  field_type TEXT NOT NULL, -- フィールドタイプ（text, number, select, checkbox）
  field_options JSONB, -- selectタイプの場合の選択肢
  is_required BOOLEAN DEFAULT true,
  placeholder TEXT, -- プレースホルダーテキスト
  validation_rule TEXT, -- バリデーションルール
  help_text TEXT, -- ヘルプテキスト
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(treatment_code, field_name)
);

-- 病名→処置セットのマッピングテーブル
-- Disease to Treatment Set Mapping
CREATE TABLE IF NOT EXISTS disease_treatment_set_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_code TEXT NOT NULL, -- disease_codes.code を参照
  set_id UUID NOT NULL REFERENCES treatment_sets(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0, -- 優先度（高い方が優先）
  condition_notes TEXT, -- 適用条件のメモ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(disease_code, set_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_treatment_set_items_set_id ON treatment_set_items(set_id);
CREATE INDEX IF NOT EXISTS idx_treatment_required_fields_code ON treatment_required_fields(treatment_code);
CREATE INDEX IF NOT EXISTS idx_disease_treatment_set_mapping_disease ON disease_treatment_set_mapping(disease_code);
CREATE INDEX IF NOT EXISTS idx_disease_treatment_set_mapping_set ON disease_treatment_set_mapping(set_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE treatment_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_required_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_treatment_set_mapping ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "Anyone can read treatment_sets" ON treatment_sets FOR SELECT USING (true);
CREATE POLICY "Anyone can read treatment_set_items" ON treatment_set_items FOR SELECT USING (true);
CREATE POLICY "Anyone can read treatment_required_fields" ON treatment_required_fields FOR SELECT USING (true);
CREATE POLICY "Anyone can read disease_treatment_set_mapping" ON disease_treatment_set_mapping FOR SELECT USING (true);

COMMENT ON TABLE treatment_sets IS '処置セットマスタ（抜髄セット、充填セットなど）';
COMMENT ON TABLE treatment_set_items IS '処置セットの構成要素（どの処置がセットに含まれるか）';
COMMENT ON TABLE treatment_required_fields IS '処置実施時の必須記載項目（厚生局の点数表に基づく）';
COMMENT ON TABLE disease_treatment_set_mapping IS '病名から処置セットへの自動提案マッピング';
