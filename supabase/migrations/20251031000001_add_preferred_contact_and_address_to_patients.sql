-- Add preferred_contact_method and address columns to patients table

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN patients.preferred_contact_method IS '希望連絡方法: line, email, sms';
COMMENT ON COLUMN patients.address IS '住所（統合フィールド）: postal_code + prefecture + city + address_line の統合版';
