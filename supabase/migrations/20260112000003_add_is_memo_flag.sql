-- treatment_plansテーブルにis_memoフラグを追加
-- メモ・所見として記録するか、実際の治療計画として扱うかを区別

ALTER TABLE treatment_plans
ADD COLUMN is_memo BOOLEAN DEFAULT false NOT NULL;

-- インデックス追加（メモと治療計画の分離検索用）
CREATE INDEX idx_treatment_plans_is_memo ON treatment_plans(patient_id, is_memo, sort_order);

-- コメント追加
COMMENT ON COLUMN treatment_plans.is_memo IS 'メモ・所見フラグ: true=メモ枠に表示（治療対象外）, false=治療計画として表示';
