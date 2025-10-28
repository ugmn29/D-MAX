-- LINE連携システムのテーブル作成

-- 1. LINE招待コードテーブル
CREATE TABLE IF NOT EXISTS line_invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  invitation_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_line_invitation_codes_patient_id ON line_invitation_codes(patient_id);
CREATE INDEX idx_line_invitation_codes_status ON line_invitation_codes(status);
CREATE INDEX idx_line_invitation_codes_code ON line_invitation_codes(invitation_code);
CREATE INDEX idx_line_invitation_codes_expires_at ON line_invitation_codes(expires_at);

-- 2. LINE患者連携テーブル
CREATE TABLE IF NOT EXISTS line_patient_linkages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'self' CHECK (relationship IN ('self', 'parent', 'spouse', 'child', 'other')),
  is_primary BOOLEAN DEFAULT false,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 複合ユニーク制約: 同じLINEユーザーが同じ患者に2回連携できないようにする
CREATE UNIQUE INDEX idx_line_patient_linkages_unique ON line_patient_linkages(line_user_id, patient_id);

-- インデックス
CREATE INDEX idx_line_patient_linkages_line_user_id ON line_patient_linkages(line_user_id);
CREATE INDEX idx_line_patient_linkages_patient_id ON line_patient_linkages(patient_id);
CREATE INDEX idx_line_patient_linkages_clinic_id ON line_patient_linkages(clinic_id);

-- 3. 患者QRコードテーブル
CREATE TABLE IF NOT EXISTS patient_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  qr_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_patient_qr_codes_patient_id ON patient_qr_codes(patient_id);
CREATE INDEX idx_patient_qr_codes_qr_token ON patient_qr_codes(qr_token);
CREATE INDEX idx_patient_qr_codes_clinic_id ON patient_qr_codes(clinic_id);

-- トリガー: updated_at自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_line_patient_linkages_updated_at
  BEFORE UPDATE ON line_patient_linkages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_qr_codes_updated_at
  BEFORE UPDATE ON patient_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) ポリシー
ALTER TABLE line_invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_patient_linkages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_qr_codes ENABLE ROW LEVEL SECURITY;

-- スタッフは自分のクリニックのデータのみアクセス可能
CREATE POLICY "Staff can access their clinic's invitation codes"
  ON line_invitation_codes FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can access their clinic's linkages"
  ON line_patient_linkages FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can access their clinic's QR codes"
  ON patient_qr_codes FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM staff WHERE user_id = auth.uid()));

-- コメント
COMMENT ON TABLE line_invitation_codes IS 'LINE連携用の招待コード管理テーブル';
COMMENT ON TABLE line_patient_linkages IS '患者とLINEアカウントの連携情報テーブル';
COMMENT ON TABLE patient_qr_codes IS '患者ごとのQRコード情報テーブル';

COMMENT ON COLUMN line_invitation_codes.invitation_code IS '8桁の招待コード（例: AB12-CD34）';
COMMENT ON COLUMN line_invitation_codes.status IS '招待コードの状態: pending=未使用, used=使用済み, expired=期限切れ';
COMMENT ON COLUMN line_patient_linkages.relationship IS '連携関係: self=本人, parent=親, spouse=配偶者, child=子供, other=その他';
COMMENT ON COLUMN line_patient_linkages.is_primary IS 'このLINEアカウントのメイン患者かどうか';
COMMENT ON COLUMN patient_qr_codes.qr_token IS 'QRコード用のユニークトークン';
