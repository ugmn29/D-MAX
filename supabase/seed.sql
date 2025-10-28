-- デモクリニックの作成
INSERT INTO clinics (id, name, name_kana, phone, email, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'デモ歯科医院',
  'デモシカイイン',
  '03-1234-5678',
  'demo@example.com',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- スタッフ役職をシステムテンプレートからコピー
INSERT INTO staff_positions (id, clinic_id, name, sort_order, created_at)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111'::uuid,
  name,
  sort_order,
  NOW()
FROM system_staff_positions
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- デフォルトスタッフの作成
-- 歯科医師の役職IDを取得して使用
INSERT INTO staff (id, clinic_id, position_id, name, name_kana, email, phone, role, is_active, created_at, updated_at)
VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM staff_positions WHERE clinic_id = '11111111-1111-1111-1111-111111111111' AND name = '歯科医師' LIMIT 1),
    '福永',
    'フクナガ',
    'fukunaga@example.com',
    '090-1234-5678',
    'admin',
    true,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM staff_positions WHERE clinic_id = '11111111-1111-1111-1111-111111111111' AND name = '歯科衛生士' LIMIT 1),
    '早水',
    'ハヤミズ',
    'hayamizu@example.com',
    '090-2345-6789',
    'staff',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- デフォルト勤務時間パターンの作成（削除しました - 必要に応じて手動で追加してください）

-- テスト患者の作成
INSERT INTO patients (
  id,
  clinic_id,
  patient_number,
  last_name,
  first_name,
  last_name_kana,
  first_name_kana,
  gender,
  birth_date,
  phone,
  email,
  postal_code,
  address_line,
  created_at,
  updated_at
) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    1,
    '山田',
    '太郎',
    'ヤマダ',
    'タロウ',
    'male',
    '1985-05-15',
    '090-1234-5678',
    'yamada@example.com',
    '154-0012',
    '東京都世田谷区駒沢1-2-3',
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111111',
    2,
    '佐藤',
    '花子',
    'サトウ',
    'ハナコ',
    'female',
    '1990-08-20',
    '090-2345-6789',
    'sato@example.com',
    '154-0012',
    '東京都世田谷区駒沢2-3-4',
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111111',
    3,
    '鈴木',
    '一郎',
    'スズキ',
    'イチロウ',
    'male',
    '1978-12-10',
    '090-3456-7890',
    'suzuki@example.com',
    '154-0012',
    '東京都世田谷区駒沢3-4-5',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 治療メニューの作成
INSERT INTO treatment_menus (id, clinic_id, name, level, standard_duration, sort_order, is_active, web_booking_enabled, web_booking_new_patient, web_booking_returning, created_at)
VALUES
  -- レベル1: 定期検診
  (
    '44444444-4444-4444-4444-444444444401',
    '11111111-1111-1111-1111-111111111111',
    '定期検診',
    1,
    45,
    1,
    true,
    true,
    true,
    true,
    NOW()
  ),
  -- レベル1: 一般歯科
  (
    '44444444-4444-4444-4444-444444444402',
    '11111111-1111-1111-1111-111111111111',
    '一般歯科',
    1,
    30,
    2,
    true,
    true,
    true,
    true,
    NOW()
  ),
  -- レベル2: 虫歯治療（一般歯科の下）
  (
    '44444444-4444-4444-4444-444444444403',
    '11111111-1111-1111-1111-111111111111',
    '虫歯治療',
    2,
    60,
    3,
    true,
    true,
    true,
    true,
    NOW()
  ),
  -- レベル2: 歯周病治療（一般歯科の下）
  (
    '44444444-4444-4444-4444-444444444404',
    '11111111-1111-1111-1111-111111111111',
    '歯周病治療',
    2,
    60,
    4,
    true,
    true,
    true,
    true,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 治療メニューの階層関係を設定
UPDATE treatment_menus SET parent_id = '44444444-4444-4444-4444-444444444402' WHERE id = '44444444-4444-4444-4444-444444444403';
UPDATE treatment_menus SET parent_id = '44444444-4444-4444-4444-444444444402' WHERE id = '44444444-4444-4444-4444-444444444404';

-- デフォルトクリニック設定の作成
INSERT INTO clinic_settings (clinic_id, setting_key, setting_value, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'time_slot_minutes', '15', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'unit_count', '3', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'units', '["チェア1", "チェア2", "チェア3"]', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'display_items', '[]', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'cell_height', '40', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'cancel_types', '[]', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'penalty_settings', '{"noShowThreshold": 3, "webReservationLimit": true, "penaltyPeriod": 30}', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'business_hours', '{"monday": {"isOpen": true, "timeSlots": [{"start": "09:00", "end": "18:00"}]}, "tuesday": {"isOpen": true, "timeSlots": [{"start": "09:00", "end": "18:00"}]}, "wednesday": {"isOpen": true, "timeSlots": [{"start": "09:00", "end": "18:00"}]}, "thursday": {"isOpen": true, "timeSlots": [{"start": "09:00", "end": "18:00"}]}, "friday": {"isOpen": true, "timeSlots": [{"start": "09:00", "end": "18:00"}]}, "saturday": {"isOpen": false, "timeSlots": []}, "sunday": {"isOpen": false, "timeSlots": []}}', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'break_times', '{"monday": {"start": "13:00", "end": "14:30"}, "tuesday": {"start": "13:00", "end": "14:30"}, "wednesday": {"start": "13:00", "end": "14:30"}, "thursday": {"start": "13:00", "end": "14:30"}, "friday": {"start": "13:00", "end": "14:30"}, "saturday": null, "sunday": null}', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', 'holidays', '["sunday"]', NOW(), NOW())
ON CONFLICT (clinic_id, setting_key) DO NOTHING;

-- デモクリニック用の問診票を作成（システムテンプレートからコピー）
-- 標準問診表
INSERT INTO questionnaires (id, clinic_id, name, description, is_active, created_at, updated_at)
SELECT
  '11111111-1111-1111-1111-111111111112'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  name,
  description,
  is_active,
  NOW(),
  NOW()
FROM system_questionnaire_templates
WHERE id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (id) DO NOTHING;

-- 標準問診表の質問項目をコピー
INSERT INTO questionnaire_questions (
  questionnaire_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  linked_field,
  conditional_logic
)
SELECT
  '11111111-1111-1111-1111-111111111112'::uuid,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  linked_field,
  conditional_logic
FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- 習慣チェック表
INSERT INTO questionnaires (id, clinic_id, name, description, is_active, created_at, updated_at)
SELECT
  '11111111-1111-1111-1111-111111111113'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  name,
  description,
  is_active,
  NOW(),
  NOW()
FROM system_questionnaire_templates
WHERE id = '00000000-0000-0000-0000-000000000002'
ON CONFLICT (id) DO NOTHING;

-- 習慣チェック表の質問項目をコピー
INSERT INTO questionnaire_questions (
  questionnaire_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  linked_field,
  conditional_logic
)
SELECT
  '11111111-1111-1111-1111-111111111113'::uuid,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  linked_field,
  conditional_logic
FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000002'
ON CONFLICT DO NOTHING;