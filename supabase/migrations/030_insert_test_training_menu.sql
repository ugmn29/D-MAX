-- テスト患者（患者番号1001）にトレーニングメニューを処方
-- まず患者IDを取得
DO $$
DECLARE
  v_patient_id UUID;
  v_menu_id UUID;
  v_training_id_1 UUID;
  v_training_id_2 UUID;
  v_training_id_3 UUID;
BEGIN
  -- 患者IDを取得
  SELECT id INTO v_patient_id
  FROM patients
  WHERE patient_number = 1001
  AND clinic_id = '11111111-1111-1111-1111-111111111111'
  LIMIT 1;

  -- トレーニングIDを取得
  SELECT id INTO v_training_id_1 FROM trainings WHERE training_name = 'あいうべ体操' LIMIT 1;
  SELECT id INTO v_training_id_2 FROM trainings WHERE training_name = '舌を前に出す' LIMIT 1;
  SELECT id INTO v_training_id_3 FROM trainings WHERE training_name = '口唇閉鎖練習' LIMIT 1;

  -- 患者が見つかった場合のみメニューを作成
  IF v_patient_id IS NOT NULL THEN
    -- トレーニングメニューを作成
    INSERT INTO training_menus (
      id,
      patient_id,
      clinic_id,
      menu_name,
      is_active,
      prescribed_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_patient_id,
      '11111111-1111-1111-1111-111111111111',
      '基本トレーニングメニュー',
      true,
      NOW(),
      NOW(),
      NOW()
    ) RETURNING id INTO v_menu_id;

    -- メニューにトレーニングを追加
    INSERT INTO menu_trainings (id, menu_id, training_id, sort_order, action_seconds, rest_seconds, sets, auto_progress)
    VALUES
      (gen_random_uuid(), v_menu_id, v_training_id_1, 1, 30, 10, 3, false),
      (gen_random_uuid(), v_menu_id, v_training_id_2, 2, 20, 5, 5, false),
      (gen_random_uuid(), v_menu_id, v_training_id_3, 3, 15, 5, 3, false);

    RAISE NOTICE 'トレーニングメニューを作成しました: 患者ID=%', v_patient_id;
  ELSE
    RAISE NOTICE '患者が見つかりませんでした';
  END IF;
END $$;
