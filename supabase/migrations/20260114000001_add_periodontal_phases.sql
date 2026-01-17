-- 歯周治療フローの追加フェーズ
-- P検④、P検⑤、再SRP（SRP_2, SRP_3）を追加

-- periodontal_phaseカラムの制約を更新
-- 既存: P_EXAM_1, INITIAL, P_EXAM_2, SRP, P_HEAVY_PREVENTION, SURGERY, P_EXAM_3, MAINTENANCE
-- 追加: P_EXAM_4, P_EXAM_5, SRP_2, SRP_3, SURGERY_2

-- 注意: PostgreSQLのVARCHARカラムには値の制約がないため、
-- アプリケーション側で型定義を更新するだけで対応可能

COMMENT ON COLUMN treatment_plans.periodontal_phase IS '歯周治療フェーズ: P_EXAM_1(P検①), INITIAL(初期治療), P_EXAM_2(P検②), SRP(SRP), P_EXAM_3(P検③), P_EXAM_4(P検④), P_EXAM_5(P検⑤), SRP_2(再SRP), SRP_3(再々SRP), SURGERY(歯周外科), SURGERY_2(再歯周外科), P_HEAVY_PREVENTION(P重防), MAINTENANCE(SPT)';
