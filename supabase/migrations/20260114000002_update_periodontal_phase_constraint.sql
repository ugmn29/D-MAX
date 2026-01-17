-- periodontal_phase カラムのCHECK制約を更新
-- 新しいフェーズを追加: SRP, SRP_2, SRP_3, P_HEAVY_PREVENTION, P_EXAM_4, P_EXAM_5, SURGERY_2

-- 既存の制約を削除
ALTER TABLE treatment_plans DROP CONSTRAINT IF EXISTS treatment_plans_periodontal_phase_check;

-- 新しい制約を追加
ALTER TABLE treatment_plans ADD CONSTRAINT treatment_plans_periodontal_phase_check CHECK (
  periodontal_phase IS NULL OR
  periodontal_phase IN (
    'P_EXAM_1',           -- P検①
    'INITIAL',            -- 初期治療
    'P_EXAM_2',           -- P検②
    'SRP',                -- SRP
    'SRP_2',              -- 再SRP
    'SRP_3',              -- 再々SRP
    'P_HEAVY_PREVENTION', -- P重防（歯周病重症化予防治療）
    'SURGERY',            -- 歯周外科（Fop）
    'SURGERY_2',          -- 再歯周外科
    'P_EXAM_3',           -- P検③
    'P_EXAM_4',           -- P検④
    'P_EXAM_5',           -- P検⑤
    'MAINTENANCE'         -- SPT（メンテナンス期）
  )
);

-- コメントを更新
COMMENT ON COLUMN treatment_plans.periodontal_phase IS '歯周治療フェーズ: P_EXAM_1(P検①), INITIAL(初期治療), P_EXAM_2(P検②), SRP(SRP), SRP_2(再SRP), SRP_3(再々SRP), P_HEAVY_PREVENTION(P重防), SURGERY(歯周外科), SURGERY_2(再歯周外科), P_EXAM_3(P検③), P_EXAM_4(P検④), P_EXAM_5(P検⑤), MAINTENANCE(SPT)';
