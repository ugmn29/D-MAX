-- サブカルテ機能のテーブル作成

-- サブカルテエントリテーブル
CREATE TABLE IF NOT EXISTS subkarte_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('text', 'handwriting', 'audio', 'file', 'template')),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サブカルテ添付ファイルテーブル
CREATE TABLE IF NOT EXISTS subkarte_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES subkarte_entries(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サブカルテ手書きデータテーブル
CREATE TABLE IF NOT EXISTS subkarte_handwriting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES subkarte_entries(id) ON DELETE CASCADE,
  canvas_data TEXT NOT NULL, -- Base64エンコードされたCanvasデータ
  image_data TEXT, -- 手書きデータの画像データ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サブカルテ音声データテーブル（一時保存用）
CREATE TABLE IF NOT EXISTS subkarte_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES subkarte_entries(id) ON DELETE CASCADE,
  audio_file_path VARCHAR(500) NOT NULL,
  transcription TEXT,
  duration_seconds INTEGER,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour') -- 1時間後に自動削除
);

-- サブカルテテンプレートテーブル
CREATE TABLE IF NOT EXISTS subkarte_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_subkarte_entries_patient_id ON subkarte_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_subkarte_entries_created_at ON subkarte_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_subkarte_attachments_entry_id ON subkarte_attachments(entry_id);
CREATE INDEX IF NOT EXISTS idx_subkarte_handwriting_entry_id ON subkarte_handwriting(entry_id);
CREATE INDEX IF NOT EXISTS idx_subkarte_audio_entry_id ON subkarte_audio(entry_id);
CREATE INDEX IF NOT EXISTS idx_subkarte_audio_expires_at ON subkarte_audio(expires_at);
CREATE INDEX IF NOT EXISTS idx_subkarte_templates_clinic_id ON subkarte_templates(clinic_id);

-- RLS設定（開発環境では無効化）
ALTER TABLE subkarte_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE subkarte_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE subkarte_handwriting DISABLE ROW LEVEL SECURITY;
ALTER TABLE subkarte_audio DISABLE ROW LEVEL SECURITY;
ALTER TABLE subkarte_templates DISABLE ROW LEVEL SECURITY;

-- 音声データの自動削除用の関数（1時間後に期限切れのデータを削除）
CREATE OR REPLACE FUNCTION cleanup_expired_audio_data()
RETURNS void AS $$
BEGIN
  DELETE FROM subkarte_audio WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 定期実行用の関数（実際の運用ではcronジョブなどで実行）
-- SELECT cleanup_expired_audio_data();
