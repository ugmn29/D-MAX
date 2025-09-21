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

-- デフォルト役職の作成
INSERT INTO staff_positions (id, clinic_id, name, sort_order, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', '歯科医師', 1, NOW()),
  ('11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', '歯科衛生士', 2, NOW()),
  ('11111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', '歯科助手', 3, NOW()),
  ('11111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', '受付', 4, NOW())
ON CONFLICT (id) DO NOTHING;

-- デフォルトスタッフの作成
INSERT INTO staff (id, clinic_id, position_id, name, name_kana, email, phone, role, is_active, created_at, updated_at)
VALUES 
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111101', '福永', 'フクナガ', 'fukunaga@example.com', '090-1234-5678', 'staff', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111102', '早水', 'ハヤミズ', 'hayamizu@example.com', '090-2345-6789', 'staff', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111103', '佐藤 美咲', 'サトウ ミサキ', 'sato.misaki@example.com', '090-3456-7890', 'staff', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111103', '山田 健一', 'ヤマダ ケンイチ', 'yamada.kenichi@example.com', '090-4567-8901', 'staff', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111103', '早水 花子', 'ハヤミズ ハナコ', 'hayamizu.hanako@example.com', '090-5678-9012', 'staff', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111103', '田中 次郎', 'タナカ ジロウ', 'tanaka.jiro@example.com', '090-6789-0123', 'staff', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- デフォルト勤務時間パターンの作成
INSERT INTO shift_patterns (id, clinic_id, abbreviation, name, start_time, end_time, break_start, break_end, memo, created_at)
VALUES 
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', 'F', 'フルタイム', '09:00', '18:00', '13:00', '14:30', '', NOW()),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', 'AM', '午前のみ', '09:00', '13:00', '00:00', '00:00', '', NOW()),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', 'PM', '午後のみ', '14:30', '18:00', '00:00', '00:00', '', NOW())
ON CONFLICT (id) DO NOTHING;

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