-- D-MAX 初期データベーススキーマ
-- マルチテナント対応（クリニックごとにデータ分離）

-- 拡張機能の有効化（Supabaseでは標準で利用可能）
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM型の定義
CREATE TYPE staff_role AS ENUM ('admin', 'clinic', 'staff');
CREATE TYPE patient_gender AS ENUM ('male', 'female', 'other');
CREATE TYPE appointment_status AS ENUM ('未来院', '遅刻', '来院済み', '診療中', '会計', '終了', 'キャンセル');
CREATE TYPE log_action AS ENUM ('作成', '変更', 'キャンセル', '削除');

-- クリニック（テナント）テーブル
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_kana VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    website_url TEXT,
    postal_code VARCHAR(10),
    prefecture VARCHAR(50),
    city VARCHAR(100),
    address_line TEXT,
    business_hours JSONB, -- 曜日別営業時間
    break_times JSONB,    -- 休憩時間
    time_slot_minutes INTEGER DEFAULT 15, -- 1コマの時間（分）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スタッフ役職マスタ
CREATE TABLE staff_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スタッフテーブル
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    position_id UUID REFERENCES staff_positions(id),
    name VARCHAR(100) NOT NULL,
    name_kana VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    employee_number VARCHAR(50),
    role staff_role DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユニット（診療台）テーブル
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 診療メニューテーブル（3階層）
CREATE TABLE treatment_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES treatment_menus(id),
    level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
    name VARCHAR(255) NOT NULL,
    standard_duration INTEGER, -- 標準時間（分）
    color VARCHAR(7), -- カラーコード
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 患者特記事項マスタ
CREATE TABLE patient_note_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 患者テーブル
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_number INTEGER NOT NULL, -- クリニック内での連番
    global_uuid UUID UNIQUE DEFAULT gen_random_uuid(), -- 全システム共通ID

    -- 基本情報
    last_name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name_kana VARCHAR(50),
    first_name_kana VARCHAR(50),
    birth_date DATE,
    gender patient_gender,

    -- 連絡先
    phone VARCHAR(20),
    email VARCHAR(255),
    postal_code VARCHAR(10),
    prefecture VARCHAR(50),
    city VARCHAR(100),
    address_line TEXT,

    -- 医療情報
    allergies TEXT,
    medical_history TEXT,
    primary_doctor_id UUID REFERENCES staff(id),
    primary_hygienist_id UUID REFERENCES staff(id),

    -- 保険情報（暗号化）
    insurance_data BYTEA, -- AES-256-GCM暗号化済み

    -- ステータス
    is_registered BOOLEAN DEFAULT false, -- 本登録済みフラグ
    family_group_id UUID, -- 家族連携用

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(clinic_id, patient_number)
);

-- 患者特記事項紐付け
CREATE TABLE patient_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    note_type_id UUID NOT NULL REFERENCES patient_note_types(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約テーブル
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- 日時・場所
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    unit_id UUID REFERENCES units(id),

    -- 診療内容
    menu1_id UUID REFERENCES treatment_menus(id),
    menu2_id UUID REFERENCES treatment_menus(id),
    menu3_id UUID REFERENCES treatment_menus(id),

    -- 担当者
    staff1_id UUID REFERENCES staff(id),
    staff2_id UUID REFERENCES staff(id),
    staff3_id UUID REFERENCES staff(id),

    -- ステータス
    status appointment_status DEFAULT '未来院',

    -- その他
    memo TEXT,
    created_by UUID REFERENCES staff(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約操作ログテーブル
CREATE TABLE appointment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    action log_action NOT NULL,
    before_data JSONB,
    after_data JSONB,
    reason TEXT NOT NULL,
    operator_id UUID NOT NULL REFERENCES staff(id),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- シフトテーブル
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    break_start_time TIME,
    break_end_time TIME,
    pattern_name VARCHAR(50), -- フルタイム、午前、午後など
    is_absent BOOLEAN DEFAULT false,
    substitute_for_id UUID REFERENCES staff(id), -- 代診情報
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(clinic_id, staff_id, date)
);

-- 設定テーブル
CREATE TABLE clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(clinic_id, setting_key)
);

-- 日次メモテーブル
CREATE TABLE daily_memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    memo TEXT,
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(clinic_id, date)
);

-- インデックス作成
CREATE INDEX idx_appointments_clinic_date ON appointments(clinic_id, appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_staff ON appointments(staff1_id, staff2_id, staff3_id);
CREATE INDEX idx_patients_clinic_number ON patients(clinic_id, patient_number);
CREATE INDEX idx_patients_name ON patients(clinic_id, last_name, first_name);
CREATE INDEX idx_shifts_clinic_date ON shifts(clinic_id, date);

-- RLS (Row Level Security) 設定
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（例：ユーザーは自分のクリニックのデータのみアクセス可能）
CREATE POLICY clinic_access ON clinics
    FOR ALL TO authenticated
    USING (id = (auth.jwt() ->> 'clinic_id')::uuid);

CREATE POLICY staff_clinic_access ON staff
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

CREATE POLICY patients_clinic_access ON patients
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

CREATE POLICY appointments_clinic_access ON appointments
    FOR ALL TO authenticated
    USING (clinic_id = (auth.jwt() ->> 'clinic_id')::uuid);

-- 更新時刻の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();