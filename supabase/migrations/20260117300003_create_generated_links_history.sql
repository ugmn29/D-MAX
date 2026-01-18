-- リンク生成履歴テーブル（QRコード・SNSリンクの生成履歴を保存）

CREATE TABLE generated_links_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- リンクタイプ
  link_type TEXT NOT NULL CHECK (link_type IN ('qr_code', 'sns_link', 'hp_embed')),

  -- 生成されたURL
  generated_url TEXT NOT NULL,
  destination_url TEXT NOT NULL,

  -- UTMパラメータ
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,

  -- メタ情報
  platform TEXT, -- instagram, youtube, flyer など
  placement TEXT, -- profile, story, header など
  label TEXT, -- ユーザーが付けたラベル

  -- QRコード情報（QRの場合のみ）
  qr_code_url TEXT,

  -- 使用状況
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMP WITH TIME ZONE,

  -- 作成者
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_generated_links_clinic ON generated_links_history(clinic_id);
CREATE INDEX idx_generated_links_type ON generated_links_history(link_type);
CREATE INDEX idx_generated_links_platform ON generated_links_history(platform);
CREATE INDEX idx_generated_links_created ON generated_links_history(created_at);

-- RLSポリシー
ALTER TABLE generated_links_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_links_select" ON generated_links_history
  FOR SELECT USING (true);

CREATE POLICY "generated_links_insert" ON generated_links_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "generated_links_update" ON generated_links_history
  FOR UPDATE USING (true);

CREATE POLICY "generated_links_delete" ON generated_links_history
  FOR DELETE USING (true);

COMMENT ON TABLE generated_links_history IS 'リンク生成履歴 - QRコード・SNSリンク・埋め込みコードの生成履歴';
