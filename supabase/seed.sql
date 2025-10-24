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

-- スタッフ役職はシステムテンプレートから自動コピーされます
-- （医院初期化API経由で作成）

-- デフォルトスタッフの作成
-- 注意: position_idはシステムテンプレートから生成された役職IDを参照する必要があります
-- 一旦コメントアウト（必要に応じて後で追加）
-- INSERT INTO staff (id, clinic_id, position_id, name, name_kana, email, phone, role, is_active, created_at, updated_at)
-- VALUES
--   ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', NULL, '福永', 'フクナガ', 'fukunaga@example.com', '090-1234-5678', 'staff', true, NOW(), NOW()),
--   ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', NULL, '早水', 'ハヤミズ', 'hayamizu@example.com', '090-2345-6789', 'staff', true, NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- デフォルト勤務時間パターンの作成（削除しました - 必要に応じて手動で追加してください）

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