-- すべてのテーブルのRLSポリシーを修正
-- 開発環境でのアクセスを許可する

-- staff_positionsテーブル
DROP POLICY IF EXISTS staff_positions_development_access ON staff_positions;
CREATE POLICY staff_positions_allow_all ON staff_positions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- unitsテーブル
DROP POLICY IF EXISTS units_development_access ON units;
CREATE POLICY units_allow_all ON units
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- patient_note_typesテーブル
DROP POLICY IF EXISTS patient_note_types_development_access ON patient_note_types;
CREATE POLICY patient_note_types_allow_all ON patient_note_types
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- patient_notesテーブル
DROP POLICY IF EXISTS patient_notes_development_access ON patient_notes;
CREATE POLICY patient_notes_allow_all ON patient_notes
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- appointment_logsテーブル
DROP POLICY IF EXISTS appointment_logs_development_access ON appointment_logs;
CREATE POLICY appointment_logs_allow_all ON appointment_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 既存のポリシーも修正
DROP POLICY IF EXISTS clinic_access ON clinics;
CREATE POLICY clinics_allow_all ON clinics
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS staff_clinic_access ON staff;
CREATE POLICY staff_allow_all ON staff
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS patients_clinic_access ON patients;
CREATE POLICY patients_allow_all ON patients
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS appointments_clinic_access ON appointments;
CREATE POLICY appointments_allow_all ON appointments
    FOR ALL
    USING (true)
    WITH CHECK (true);
