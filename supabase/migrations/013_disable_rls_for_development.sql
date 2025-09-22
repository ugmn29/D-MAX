-- 開発環境用：すべてのテーブルのRLSを無効化
-- 本番環境では実行しないでください

-- treatment_menusテーブルのRLSを無効化
ALTER TABLE treatment_menus DISABLE ROW LEVEL SECURITY;

-- staff_positionsテーブルのRLSを無効化
ALTER TABLE staff_positions DISABLE ROW LEVEL SECURITY;

-- unitsテーブルのRLSを無効化
ALTER TABLE units DISABLE ROW LEVEL SECURITY;

-- patient_note_typesテーブルのRLSを無効化
ALTER TABLE patient_note_types DISABLE ROW LEVEL SECURITY;

-- patient_notesテーブルのRLSを無効化
ALTER TABLE patient_notes DISABLE ROW LEVEL SECURITY;

-- appointment_logsテーブルのRLSを無効化
ALTER TABLE appointment_logs DISABLE ROW LEVEL SECURITY;

-- clinicsテーブルのRLSを無効化
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;

-- staffテーブルのRLSを無効化
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- patientsテーブルのRLSを無効化
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- appointmentsテーブルのRLSを無効化
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- shiftsテーブルのRLSを無効化
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- clinic_settingsテーブルのRLSを無効化
ALTER TABLE clinic_settings DISABLE ROW LEVEL SECURITY;

-- daily_memosテーブルのRLSを無効化
ALTER TABLE daily_memos DISABLE ROW LEVEL SECURITY;
