-- periodontal_phase に SRP と P_HEAVY_PREVENTION を追加

-- 既存の制約を削除
ALTER TABLE treatment_plans DROP CONSTRAINT IF EXISTS treatment_plans_periodontal_phase_check;

-- 新しい制約を追加（SRP と P_HEAVY_PREVENTION を含む）
ALTER TABLE treatment_plans ADD CONSTRAINT treatment_plans_periodontal_phase_check CHECK (
  periodontal_phase IS NULL OR
  periodontal_phase IN (
    'P_EXAM_1',           -- P検査1
    'INITIAL',            -- 初期治療
    'P_EXAM_2',           -- P検査2（再評価1）
    'SRP',                -- SRP（スケーリング・ルートプレーニング）
    'P_HEAVY_PREVENTION', -- P重防（歯周病重症化予防治療）
    'SURGERY',            -- 歯周外科
    'P_EXAM_3',           -- P検査3（再評価2）
    'MAINTENANCE'         -- メンテナンス期（SPT）
  )
);

COMMENT ON COLUMN treatment_plans.periodontal_phase IS '歯周病治療フェーズ: P_EXAM_1, INITIAL, P_EXAM_2, SRP, P_HEAVY_PREVENTION, SURGERY, P_EXAM_3, MAINTENANCE';
