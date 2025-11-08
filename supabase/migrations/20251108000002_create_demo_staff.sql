-- デモスタッフレコードを作成
-- clinic_idは既存のクリニックIDを使用する必要があるため、
-- 最初のクリニックIDを取得して使用
DO $$
DECLARE
    demo_clinic_id UUID;
BEGIN
    -- 既存のクリニックIDを取得（なければデモクリニックを作成）
    SELECT id INTO demo_clinic_id FROM clinics LIMIT 1;

    IF demo_clinic_id IS NULL THEN
        -- デモクリニックを作成
        INSERT INTO clinics (id, name, created_at, updated_at)
        VALUES (
            '11111111-1111-1111-1111-111111111111',
            'デモクリニック',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        demo_clinic_id := '11111111-1111-1111-1111-111111111111';
    END IF;

    -- デモスタッフを作成
    INSERT INTO staff (id, clinic_id, name, email, role, is_active, created_at, updated_at)
    VALUES (
        '11111111-1111-1111-1111-111111111111',
        demo_clinic_id,
        'デモスタッフ',
        'demo@example.com',
        'admin',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
END $$;
