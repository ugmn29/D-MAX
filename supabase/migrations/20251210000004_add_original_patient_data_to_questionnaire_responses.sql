-- 問診票回答テーブルに元の患者データ保存用カラムを追加
-- 連携解除時に元の状態に復元するため

ALTER TABLE questionnaire_responses
ADD COLUMN IF NOT EXISTS original_patient_data jsonb;

COMMENT ON COLUMN questionnaire_responses.original_patient_data IS '問診票連携前の患者データ（連携解除時の復元用）';
