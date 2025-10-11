-- 旧システムの患者情報を保存するフィールドを追加
-- 他社予約システムからの移行をサポート

-- 患者テーブルに旧システム関連のフィールドを追加
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS legacy_patient_number VARCHAR(50);

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS legacy_system_name VARCHAR(100);

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;

-- 旧患者番号での検索を高速化するインデックス
CREATE INDEX IF NOT EXISTS idx_patients_legacy_number
ON patients(clinic_id, legacy_patient_number);

-- コメント追加（ドキュメント化）
COMMENT ON COLUMN patients.legacy_patient_number IS '旧システムの患者番号（移行時に保存、文字列対応）例: P-1001, K-0001など';
COMMENT ON COLUMN patients.legacy_system_name IS '移行元システム名（例: デントネット、Apotool、デンタルX）';
COMMENT ON COLUMN patients.migrated_at IS 'データ移行実行日時';
