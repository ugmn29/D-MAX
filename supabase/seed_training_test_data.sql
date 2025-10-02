-- トレーニングシステム テストデータ作成
-- 作成日: 2025-10-02

-- =====================================
-- 1. テストクリニック作成
-- =====================================

INSERT INTO clinics (id, name, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'テスト歯科クリニック', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================
-- 2. テスト患者作成（トレーニング用）
-- =====================================

-- 患者1: パスワード未設定（生年月日でログイン）
INSERT INTO patients (
  id, clinic_id, patient_number, last_name, first_name,
  last_name_kana, first_name_kana, birth_date, gender,
  is_registered, password_set, created_at, updated_at
)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    101,
    '山田',
    '太郎',
    'ヤマダ',
    'タロウ',
    '2015-04-15', -- 生年月日: 20150415 でログイン可能
    'male',
    true,
    false,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 患者2: パスワード設定済み
INSERT INTO patients (
  id, clinic_id, patient_number, last_name, first_name,
  last_name_kana, first_name_kana, birth_date, gender,
  is_registered, password_set, password_hash, created_at, updated_at
)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    102,
    '佐藤',
    '花子',
    'サトウ',
    'ハナコ',
    '2016-08-20', -- 生年月日: 20160820
    'female',
    true,
    true,
    '$2a$10$X5Z5Z5Z5Z5Z5Z5Z5Z5Z5ZuN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', -- パスワード: "password123" のハッシュ (bcrypt)
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 患者3: 追加のテスト患者
INSERT INTO patients (
  id, clinic_id, patient_number, last_name, first_name,
  last_name_kana, first_name_kana, birth_date, gender,
  is_registered, password_set, created_at, updated_at
)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    103,
    '鈴木',
    '一郎',
    'スズキ',
    'イチロウ',
    '2014-12-03', -- 生年月日: 20141203
    'male',
    true,
    false,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================
-- 3. テストトレーニングメニュー作成
-- =====================================

-- 患者1（山田太郎）のトレーニングメニュー
INSERT INTO training_menus (
  id, patient_id, clinic_id, menu_name, is_active, created_at, updated_at
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '基本トレーニングメニュー',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- メニューに3つのトレーニングを追加
-- トレーニング1: 『あ』の口の確認
INSERT INTO menu_trainings (
  menu_id, training_id, sort_order,
  action_seconds, rest_seconds, sets, auto_progress
)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  id,
  1,
  10,
  5,
  10,
  false
FROM trainings
WHERE training_name = '『あ』の口の確認' AND is_default = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- トレーニング2: 舌を前に出す
INSERT INTO menu_trainings (
  menu_id, training_id, sort_order,
  action_seconds, rest_seconds, sets, auto_progress
)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  id,
  2,
  5,
  5,
  10,
  false
FROM trainings
WHERE training_name = '舌を前に出す' AND is_default = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- トレーニング3: あいうべ体操
INSERT INTO menu_trainings (
  menu_id, training_id, sort_order,
  action_seconds, rest_seconds, sets, auto_progress
)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  id,
  3,
  5,
  5,
  30,
  false
FROM trainings
WHERE training_name = 'あいうべ体操' AND is_default = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- 患者2（佐藤花子）のトレーニングメニュー
INSERT INTO training_menus (
  id, patient_id, clinic_id, menu_name, is_active, created_at, updated_at
)
VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '舌トレーニング強化メニュー',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 舌トレーニング2つ追加
INSERT INTO menu_trainings (
  menu_id, training_id, sort_order,
  action_seconds, rest_seconds, sets, auto_progress
)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  id,
  1,
  10,
  5,
  10,
  false
FROM trainings
WHERE training_name = '舌を左右に振る' AND is_default = true
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO menu_trainings (
  menu_id, training_id, sort_order,
  action_seconds, rest_seconds, sets, auto_progress
)
SELECT
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  id,
  2,
  10,
  5,
  10,
  false
FROM trainings
WHERE training_name = '口唇をなぞる' AND is_default = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================
-- 4. 過去のトレーニング実施記録作成（進捗表示用）
-- =====================================

-- 患者1の過去7日間の記録を作成
DO $$
DECLARE
  patient_uuid UUID := '22222222-2222-2222-2222-222222222222';
  clinic_uuid UUID := '11111111-1111-1111-1111-111111111111';
  menu_uuid UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  training_uuid UUID;
  day_offset INTEGER;
BEGIN
  -- 『あ』の口の確認のIDを取得
  SELECT id INTO training_uuid FROM trainings
  WHERE training_name = '『あ』の口の確認' AND is_default = true LIMIT 1;

  -- 過去7日分の記録を作成
  FOR day_offset IN 1..7 LOOP
    INSERT INTO training_records (
      patient_id, clinic_id, training_id, menu_id,
      performed_at, completed, time_of_day, actual_duration_seconds
    )
    VALUES (
      patient_uuid,
      clinic_uuid,
      training_uuid,
      menu_uuid,
      NOW() - INTERVAL '1 day' * day_offset,
      true,
      'morning',
      120
    );
  END LOOP;
END $$;

-- =====================================
-- 完了メッセージ
-- =====================================

DO $$
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Test data created successfully!';
  RAISE NOTICE '======================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Clinic:';
  RAISE NOTICE '  - Name: テスト歯科クリニック';
  RAISE NOTICE '  - ID: 11111111-1111-1111-1111-111111111111';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Patients:';
  RAISE NOTICE '';
  RAISE NOTICE '1. 山田太郎 (Password not set - use birth date)';
  RAISE NOTICE '   - Patient Number: 101';
  RAISE NOTICE '   - Birth Date: 2015-04-15';
  RAISE NOTICE '   - Login credential: 20150415';
  RAISE NOTICE '   - Menu: 基本トレーニングメニュー (3 trainings)';
  RAISE NOTICE '';
  RAISE NOTICE '2. 佐藤花子 (Password set)';
  RAISE NOTICE '   - Patient Number: 102';
  RAISE NOTICE '   - Birth Date: 2016-08-20';
  RAISE NOTICE '   - Password: password123';
  RAISE NOTICE '   - Menu: 舌トレーニング強化メニュー (2 trainings)';
  RAISE NOTICE '';
  RAISE NOTICE '3. 鈴木一郎 (Password not set - use birth date)';
  RAISE NOTICE '   - Patient Number: 103';
  RAISE NOTICE '   - Birth Date: 2014-12-03';
  RAISE NOTICE '   - Login credential: 20141203';
  RAISE NOTICE '   - Menu: None (for testing menu creation)';
  RAISE NOTICE '';
  RAISE NOTICE 'Login URL: http://localhost:3000/training/patient/login';
  RAISE NOTICE '======================================';
END $$;
