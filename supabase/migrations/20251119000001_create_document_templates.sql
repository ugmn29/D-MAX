-- 診療情報提供書のテンプレート管理テーブル
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT NOT NULL CHECK (document_type IN (
    '診療情報提供料(I)',
    '診療情報提供料(II)',
    '診療情報等連携共有料1',
    '診療情報等連携共有料2'
  )),
  template_key TEXT NOT NULL, -- 'impacted_wisdom_tooth', 'mri_tmj' など
  template_name TEXT NOT NULL, -- 表示名（例：「親知らず抜歯依頼」）
  template_data JSONB NOT NULL, -- テンプレートの各フィールドデータ
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_type, template_key)
);

-- インデックス作成
CREATE INDEX idx_document_templates_type ON document_templates(document_type);
CREATE INDEX idx_document_templates_active ON document_templates(is_active);
CREATE INDEX idx_document_templates_order ON document_templates(document_type, display_order);

-- RLS（Row Level Security）の有効化
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- すべての認証済みユーザーが読み取り・編集可能
CREATE POLICY "Allow all authenticated users to view templates"
  ON document_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all authenticated users to insert templates"
  ON document_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update templates"
  ON document_templates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow all authenticated users to delete templates"
  ON document_templates FOR DELETE
  TO authenticated
  USING (true);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_document_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_document_templates_updated_at();
