-- メモTODOテンプレートテーブル
CREATE TABLE memo_todo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  items TEXT NOT NULL, -- 改行区切りでTODO項目を保存
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_memo_todo_templates_clinic_id ON memo_todo_templates(clinic_id);
CREATE INDEX idx_memo_todo_templates_sort_order ON memo_todo_templates(sort_order);

-- RLS有効化
ALTER TABLE memo_todo_templates ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Enable read access for clinic members" ON memo_todo_templates
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON memo_todo_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON memo_todo_templates
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON memo_todo_templates
  FOR DELETE USING (true);

-- 更新日時自動更新トリガー
CREATE TRIGGER update_memo_todo_templates_updated_at
  BEFORE UPDATE ON memo_todo_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
