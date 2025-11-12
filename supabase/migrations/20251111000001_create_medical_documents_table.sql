-- 提供文書テーブル
CREATE TABLE IF NOT EXISTS medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        '歯科疾患管理料',
        '口腔機能低下症',
        '口腔機能発達不全症',
        '歯科衛生士実地指導',
        '診療情報提供書'
    )),
    document_subtype VARCHAR(50), -- '管理計画書', '管理報告書' など
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL, -- 文書の全データ（フィールド値）
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT medical_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_medical_documents_patient_id ON medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_clinic_id ON medical_documents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_medical_documents_document_type ON medical_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_medical_documents_created_at ON medical_documents(created_at DESC);

-- RLS設定
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;

-- ポリシー作成（認証済みユーザーは全アクセス可能）
CREATE POLICY medical_documents_all_access ON medical_documents
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_medical_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_medical_documents_updated_at
    BEFORE UPDATE ON medical_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_medical_documents_updated_at();

-- コメント
COMMENT ON TABLE medical_documents IS '医療提供文書（歯科疾患管理料、診断書など）';
COMMENT ON COLUMN medical_documents.document_type IS '文書種類';
COMMENT ON COLUMN medical_documents.document_subtype IS '文書サブタイプ（管理計画書/管理報告書など）';
COMMENT ON COLUMN medical_documents.content IS '文書内容（JSONB形式）';
