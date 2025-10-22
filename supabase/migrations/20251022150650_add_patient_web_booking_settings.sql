-- Patient web booking settings table
CREATE TABLE IF NOT EXISTS patient_web_booking_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- Basic settings
  web_booking_enabled BOOLEAN NOT NULL DEFAULT true,
  web_cancel_enabled BOOLEAN NOT NULL DEFAULT true,
  web_reschedule_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Limit settings
  web_cancel_limit INTEGER DEFAULT NULL,
  cancel_deadline_hours INTEGER DEFAULT NULL,
  max_concurrent_bookings INTEGER DEFAULT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(patient_id, clinic_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_web_booking_settings_patient_id ON patient_web_booking_settings(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_web_booking_settings_clinic_id ON patient_web_booking_settings(clinic_id);

-- Enable RLS
ALTER TABLE patient_web_booking_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Clinics can manage their patients web booking settings"
  ON patient_web_booking_settings
  FOR ALL
  USING (clinic_id IN (
    SELECT id FROM clinics WHERE id = clinic_id
  ));
