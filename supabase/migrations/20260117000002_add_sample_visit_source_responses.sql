-- 来院経路分析のテスト用サンプルデータ
-- 標準問診表の回答データを作成

-- まず、標準問診表をクリニックに作成（system_questionnaire_templatesからコピー）
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

-- 標準問診表の質問をコピー
INSERT INTO questionnaire_questions (
  id,
  questionnaire_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  conditional_logic,
  sort_order,
  linked_field,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111112'::uuid,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  conditional_logic,
  sort_order,
  linked_field,
  NOW(),
  NOW()
FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- まず、テスト用の患者データを作成
INSERT INTO patients (
  id,
  clinic_id,
  patient_number,
  last_name,
  first_name,
  last_name_kana,
  first_name_kana,
  birth_date,
  is_registered,
  created_at,
  updated_at
) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111', 1001, '山田', '太郎', 'ヤマダ', 'タロウ', '1985-04-15', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002'::uuid, '11111111-1111-1111-1111-111111111111', 1002, '佐藤', '花子', 'サトウ', 'ハナコ', '1990-08-20', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000003'::uuid, '11111111-1111-1111-1111-111111111111', 1003, '鈴木', '一郎', 'スズキ', 'イチロウ', '1978-02-10', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111', 1004, '田中', '美咲', 'タナカ', 'ミサキ', '1995-11-05', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000005'::uuid, '11111111-1111-1111-1111-111111111111', 1005, '高橋', '健太', 'タカハシ', 'ケンタ', '1988-06-30', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000006'::uuid, '11111111-1111-1111-1111-111111111111', 1006, '渡辺', 'さくら', 'ワタナベ', 'サクラ', '1992-03-25', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000007'::uuid, '11111111-1111-1111-1111-111111111111', 1007, '伊藤', '大輔', 'イトウ', 'ダイスケ', '1980-12-01', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000008'::uuid, '11111111-1111-1111-1111-111111111111', 1008, '中村', '優子', 'ナカムラ', 'ユウコ', '1987-09-18', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000009'::uuid, '11111111-1111-1111-1111-111111111111', 1009, '小林', '翔', 'コバヤシ', 'ショウ', '1993-07-12', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000010'::uuid, '11111111-1111-1111-1111-111111111111', 1010, '加藤', '美穂', 'カトウ', 'ミホ', '1991-01-08', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- サンプル回答データを挿入（動的にquestion_idを取得して挿入）
DO $$
DECLARE
  v_question_id uuid;
  v_questionnaire_id uuid := '11111111-1111-1111-1111-111111111112';
BEGIN
  -- 来院経路の質問IDを取得
  SELECT id INTO v_question_id
  FROM questionnaire_questions
  WHERE questionnaire_id = v_questionnaire_id
    AND linked_field = 'referral_source'
  LIMIT 1;

  -- 質問が存在する場合のみ回答データを挿入
  IF v_question_id IS NOT NULL THEN
    -- 回答1: Google検索
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000001'::uuid,
            jsonb_build_object(v_question_id::text, to_jsonb(ARRAY['Google検索'])),
            '2026-01-10 10:00:00+00', NOW(), NOW());

    -- 回答2: HP + Instagram
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000002'::uuid,
            jsonb_build_object(v_question_id::text, to_jsonb(ARRAY['HP', 'Instagram'])),
            '2026-01-11 14:30:00+00', NOW(), NOW());

    -- 回答3: Google Map
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000003'::uuid,
            jsonb_build_object(v_question_id::text, to_jsonb(ARRAY['Google Map'])),
            '2026-01-12 09:15:00+00', NOW(), NOW());

    -- 回答4: ご紹介
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000004'::uuid,
            jsonb_build_object(v_question_id::text, to_jsonb(ARRAY['ご紹介'])),
            '2026-01-13 11:45:00+00', NOW(), NOW());

    -- 回答5: その他（自由記述）
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000005'::uuid,
            jsonb_build_object(
              v_question_id::text, to_jsonb(ARRAY['その他']),
              v_question_id::text || '_other', '友人からの口コミで知りました'
            ),
            '2026-01-14 16:20:00+00', NOW(), NOW());

    -- 回答6: YouTube + 看板
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000006'::uuid,
            jsonb_build_object(v_question_id::text, to_jsonb(ARRAY['YouTube', '看板'])),
            '2026-01-15 13:00:00+00', NOW(), NOW());

    -- 回答7: Google検索（先月）
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000007'::uuid,
            jsonb_build_object(v_question_id::text, to_jsonb(ARRAY['Google検索'])),
            '2025-12-15 10:00:00+00', NOW(), NOW());

    -- 回答8: HP（先月）
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000008'::uuid,
            jsonb_build_object(v_question_id::text, to_jsonb(ARRAY['HP'])),
            '2025-12-20 14:30:00+00', NOW(), NOW());

    -- 回答9: Epark
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000009'::uuid,
            jsonb_build_object(v_question_id::text, to_jsonb(ARRAY['Epark'])),
            '2026-01-16 10:30:00+00', NOW(), NOW());

    -- 回答10: Google検索 + HP
    INSERT INTO questionnaire_responses (id, questionnaire_id, patient_id, response_data, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_questionnaire_id, '00000000-0000-0000-0000-000000000010'::uuid,
            jsonb_build_object(v_question_id::text, to_jsonb(ARRAY['Google検索', 'HP'])),
            '2026-01-17 15:45:00+00', NOW(), NOW());
  END IF;
END $$;
