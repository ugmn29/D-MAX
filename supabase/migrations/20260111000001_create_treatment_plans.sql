-- 既存のテーブルを削除（開発環境のみ）
DROP TABLE IF EXISTS treatment_plans CASCADE;

-- 治療計画テーブル作成
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  patient_id TEXT NOT NULL,

  -- 治療内容
  treatment_content TEXT NOT NULL,
  treatment_menu_id UUID,

  -- 担当者区分（ドクター or 衛生士）
  staff_type VARCHAR(20) NOT NULL CHECK (staff_type IN ('doctor', 'hygienist')),

  -- 対象歯
  tooth_number VARCHAR(10),
  tooth_position VARCHAR(50),

  -- 優先度・順序
  priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)), -- 1:高, 2:中, 3:低
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- 衛生士メニュー（staff_type='hygienist'の場合）
  hygienist_menu_type VARCHAR(20) CHECK (
    hygienist_menu_type IS NULL OR
    hygienist_menu_type IN ('TBI', 'SRP', 'PMT', 'SPT', 'P_JUBO', 'OTHER')
  ),
  hygienist_menu_detail TEXT,

  -- 歯周病治療フェーズ
  periodontal_phase VARCHAR(20) CHECK (
    periodontal_phase IS NULL OR
    periodontal_phase IN (
      'P_EXAM_1',      -- P検査1
      'INITIAL',       -- 初期治療
      'P_EXAM_2',      -- P検査2（再評価1）
      'SURGERY',       -- 歯周外科
      'P_EXAM_3',      -- P検査3（再評価2）
      'MAINTENANCE'    -- メンテナンス期
    )
  ),
  periodontal_phase_detail JSONB,

  -- ステータス
  status VARCHAR(20) DEFAULT 'planned' CHECK (
    status IN ('planned', 'in_progress', 'completed', 'cancelled')
  ),
  completed_at TIMESTAMPTZ,

  -- 実施記録
  implemented_date DATE,
  implemented_by TEXT,
  memo TEXT,

  -- サブカルテ連携
  subkarte_id UUID,

  -- タイムスタンプ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinic ON treatment_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_staff_type ON treatment_plans(staff_type);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_sort_order ON treatment_plans(patient_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_subkarte ON treatment_plans(subkarte_id);

-- 更新時刻の自動更新トリガー
CREATE OR REPLACE FUNCTION update_treatment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER treatment_plans_updated_at
  BEFORE UPDATE ON treatment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_treatment_plans_updated_at();

-- RLSポリシー設定（開発中は無効化）
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

-- 一時的に全アクセス許可（本番環境では適切なポリシーに変更）
CREATE POLICY "Enable all access for development" ON treatment_plans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- コメント追加
COMMENT ON TABLE treatment_plans IS '患者の治療計画を管理するテーブル';
COMMENT ON COLUMN treatment_plans.staff_type IS '担当者区分: doctor(ドクター) or hygienist(衛生士)';
COMMENT ON COLUMN treatment_plans.hygienist_menu_type IS '衛生士メニュー種別: TBI, SRP, PMT, SPT, P_JUBO(P重防), OTHER';
COMMENT ON COLUMN treatment_plans.periodontal_phase IS '歯周病治療フェーズ: P_EXAM_1, INITIAL, P_EXAM_2, SURGERY, P_EXAM_3, MAINTENANCE';
COMMENT ON COLUMN treatment_plans.priority IS '優先度: 1(高), 2(中), 3(低)';
COMMENT ON COLUMN treatment_plans.sort_order IS '実施順序（小さい順に実施）';
