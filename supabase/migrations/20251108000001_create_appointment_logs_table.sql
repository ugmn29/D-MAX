-- 予約操作ログテーブル
CREATE TABLE IF NOT EXISTS appointment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('作成', '変更', 'キャンセル', '削除')),
    before_data JSONB,
    after_data JSONB,
    reason TEXT NOT NULL,
    operator_id VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_appointment_logs_appointment_id ON appointment_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_logs_created_at ON appointment_logs(created_at DESC);

-- RLS設定
ALTER TABLE appointment_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー作成（認証済みユーザーは全アクセス可能）
CREATE POLICY appointment_logs_all_access ON appointment_logs
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
