-- Make patient_number nullable to support temporary patients (is_registered = false)
-- Temporary patients don't have a patient number until they complete registration

-- First, drop the unique constraint
ALTER TABLE patients
DROP CONSTRAINT IF EXISTS patients_clinic_id_patient_number_key;

-- Make patient_number nullable
ALTER TABLE patients
ALTER COLUMN patient_number DROP NOT NULL;

-- Create a unique partial index that only applies to registered patients with non-null patient_number
-- This allows multiple temporary patients to have NULL patient_number
CREATE UNIQUE INDEX patients_clinic_id_patient_number_key
ON patients (clinic_id, patient_number)
WHERE patient_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN patients.patient_number IS '患者番号（本登録時のみ設定、仮登録時はNULL）';
