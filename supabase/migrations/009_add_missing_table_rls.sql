-- 他のテーブルのRLS設定を追加
-- 開発環境ではRLSを無効化する

-- staff_positionsテーブルにRLSを有効化
ALTER TABLE staff_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_positions_development_access ON staff_positions
    FOR ALL TO authenticated
    USING (true);

-- unitsテーブルにRLSを有効化
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
CREATE POLICY units_development_access ON units
    FOR ALL TO authenticated
    USING (true);

-- treatment_menusテーブルにRLSを有効化
ALTER TABLE treatment_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY treatment_menus_development_access ON treatment_menus
    FOR ALL TO authenticated
    USING (true);

-- patient_note_typesテーブルにRLSを有効化
ALTER TABLE patient_note_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY patient_note_types_development_access ON patient_note_types
    FOR ALL TO authenticated
    USING (true);

-- patient_notesテーブルにRLSを有効化
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY patient_notes_development_access ON patient_notes
    FOR ALL TO authenticated
    USING (true);

-- appointment_logsテーブルにRLSを有効化
ALTER TABLE appointment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY appointment_logs_development_access ON appointment_logs
    FOR ALL TO authenticated
    USING (true);
