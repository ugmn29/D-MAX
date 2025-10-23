-- システムテンプレートテーブルの作成
-- 全医院で共有するマスタデータ（問診表と同じ仕組み）

-- =====================================
-- 1. スタッフ役職システムテンプレート
-- =====================================
CREATE TABLE IF NOT EXISTS system_staff_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS無効化（開発環境用）
ALTER TABLE system_staff_positions DISABLE ROW LEVEL SECURITY;

-- staff_positionsテーブルにtemplate_id追加
ALTER TABLE staff_positions
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES system_staff_positions(id) ON DELETE SET NULL;

-- =====================================
-- 2. キャンセル理由システムテンプレート
-- =====================================
CREATE TABLE IF NOT EXISTS system_cancel_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS無効化（開発環境用）
ALTER TABLE system_cancel_reasons DISABLE ROW LEVEL SECURITY;

-- cancel_reasonsテーブルにtemplate_id追加
ALTER TABLE cancel_reasons
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES system_cancel_reasons(id) ON DELETE SET NULL;

-- cancel_reasonsのRLSを無効化
ALTER TABLE cancel_reasons DISABLE ROW LEVEL SECURITY;

-- =====================================
-- 3. 通知テンプレートシステムテンプレート
-- =====================================
CREATE TABLE IF NOT EXISTS system_notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    message_template TEXT,
    line_message TEXT,
    email_subject TEXT,
    email_message TEXT,
    sms_message TEXT,
    default_timing_value INTEGER,
    default_timing_unit VARCHAR(20),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS無効化（開発環境用）
ALTER TABLE system_notification_templates DISABLE ROW LEVEL SECURITY;

-- notification_templatesテーブルにtemplate_id追加
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES system_notification_templates(id) ON DELETE SET NULL;
