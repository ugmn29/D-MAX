-- P検査に検査区分フィールドを追加
ALTER TABLE periodontal_examinations
ADD COLUMN examination_phase VARCHAR(20) CHECK (
  examination_phase IN ('P_EXAM_1', 'P_EXAM_2', 'P_EXAM_3', 'SPT', 'OTHER')
) DEFAULT 'P_EXAM_1';

-- コメント追加
COMMENT ON COLUMN periodontal_examinations.examination_phase IS '検査区分: P_EXAM_1(初診時), P_EXAM_2(SC後再評価), P_EXAM_3(SRP後再評価), SPT(安定期), OTHER(その他)';

-- インデックス追加
CREATE INDEX idx_periodontal_examinations_phase ON periodontal_examinations(patient_id, examination_phase, examination_date DESC);
