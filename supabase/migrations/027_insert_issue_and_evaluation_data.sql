-- ==========================================
-- トレーニング評価・課題管理システム - マスタデータ投入
-- 作成日: 2025-10-09
-- ==========================================

-- ==========================================
-- 1. 新規トレーニング追加
-- ==========================================

-- 17. 舌小帯伸ばし
INSERT INTO trainings (
    clinic_id, training_name, description, category,
    animation_storage_path, mirror_display, is_default,
    default_action_seconds, default_rest_seconds, default_sets
) VALUES
(NULL, '舌小帯伸ばし',
'舌の裏側にある舌小帯（舌のひも）を伸ばす練習。舌を上あごにつけながら、口を大きく開ける。',
'柔軟性', 'default/tongue-frenulum-stretch.json', false, true, 5, 5, 10);

-- 18. チューブ吸い
INSERT INTO trainings (
    clinic_id, training_name, description, category,
    animation_storage_path, mirror_display, is_default,
    default_action_seconds, default_rest_seconds, default_sets
) VALUES
(NULL, 'チューブ吸い',
'ストローやチューブを使って吸う練習。舌と口唇の協調運動を促す。',
'舌訓練', 'default/tube-suction.json', false, true, 10, 5, 10);

-- ==========================================
-- 2. 各トレーニングの評価基準設定
-- ==========================================

-- 1. 『あ』の口の確認
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '口を開けることができない、または下顎が上がってしまう、正中が揃わない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '口を開けられるが、指2本分の大きさにならない、または正中が少しずれる',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '正しい姿勢で、指2本分の大きさで正中を揃えて口を開けられる'
WHERE training_name = '『あ』の口の確認' AND clinic_id IS NULL;

-- 2. 舌を前に出す
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '舌を前に出せない、または舌尖がつぶれてしまう',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '舌を前に出せるが、真っ直ぐではない、または3-5秒維持できない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '舌を真っ直ぐ前に出し、3-5秒間維持できる'
WHERE training_name = '舌を前に出す' AND clinic_id IS NULL;

-- 3. 舌を左右に振る
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '舌を左右に振れない、または顔や顎が動いてしまう',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '舌を左右に振れるが、スムーズではない、または顔が少し動く',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '舌を思いきり前に出し、顔や顎を動かさずに左右に振れる'
WHERE training_name = '舌を左右に振る' AND clinic_id IS NULL;

-- 4. 口唇をなぞる
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '舌を尖らせることができない、または口唇をなぞれない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '口唇をなぞれるが、スムーズではない、または速さが一定でない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '舌を尖らせて、一定の速さでなめらかに上唇をなぞれる'
WHERE training_name = '口唇をなぞる' AND clinic_id IS NULL;

-- 5. スポットの位置確認
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = 'スポットに舌尖をつけられない、または位置がわからない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = 'スポットに舌尖をつけられるが、5秒間維持できない、または口を閉じるとずれる',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = 'スポットに舌尖を5秒間つけたまま、奥歯を噛み、口唇を閉じられる'
WHERE training_name = 'スポットの位置確認' AND clinic_id IS NULL;

-- 6. 吸い上げ
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '舌を上あごに吸い上げられない、または音が出ない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '吸い上げはできるが、ポンと音が出ない、または唾液を飲み込めない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '舌を上あごに吸い上げ、ポンと音を出し、唾液を飲み込める'
WHERE training_name = '吸い上げ' AND clinic_id IS NULL;

-- 7. 吸い上げができない場合
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '舌尖をスポットにつけたまま後ろに持っていけない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '舌を後ろに持っていけるが、下顎が動いてしまう',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '舌尖をスポットにつけ、下顎を動かさずに舌を後ろに持っていける'
WHERE training_name = '吸い上げができない場合' AND clinic_id IS NULL;

-- 8. 舌筋の訓練
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '舌を上あごに押し付けられない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '押し付けられるが、力が弱い、または10秒維持できない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '舌の先端少し後ろで上あごに強く押し付け、10秒維持できる'
WHERE training_name = '舌筋の訓練' AND clinic_id IS NULL;

-- 9. 上唇小帯と下唇小帯を伸ばす
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '小帯を伸ばすことができない、または痛がる',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '小帯を伸ばせるが、十分に伸ばせない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '小帯を挟むように親指を入れ、付着部を持ち上げて十分に伸ばせる'
WHERE training_name = '上唇小帯と下唇小帯を伸ばす' AND clinic_id IS NULL;

-- 10. 口唇の緊張除去
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '唇の内側に空気を入れられない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '空気を入れられるが、上下どちらか一方のみ、またはすぐに空気が抜ける',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '上下の唇の内側に空気を入れ、5秒間維持できる'
WHERE training_name = '口唇の緊張除去' AND clinic_id IS NULL;

-- 11. 息吹きかけ
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '息を吹きかけられない、または力が非常に弱い',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '息を吹きかけられるが、ティッシュが動かない、または10秒持続できない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = 'ティッシュや紙風船を動かせるだけの息を10秒間吹きかけられる'
WHERE training_name = '息吹きかけ' AND clinic_id IS NULL;

-- 12. 口輪筋訓練
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = 'リップルトレーナーを保持できない、またはすぐに外れる',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '保持できるが、引っ張るとすぐに外れる、または3秒維持できない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '唇を閉じてリップルトレーナーを保持し、引っ張っても3秒間外れない'
WHERE training_name = '口輪筋訓練' AND clinic_id IS NULL;

-- 13. あいうべ体操
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '口を大きく動かせない、または正しい形にならない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '動かせるが、動きが小さい、または1日10セット以下しかできない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '正しい姿勢で大きく「あ〜い〜う〜べ〜」と動かし、1日30セットできる'
WHERE training_name = 'あいうべ体操' AND clinic_id IS NULL;

-- 14. タラ体操
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = 'タラ体操の動きができない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '動きはできるが、正確性や持続性に課題がある',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = 'タラ体操を正しく実施できる'
WHERE training_name = 'タラ体操' AND clinic_id IS NULL;

-- 15. ガムトレーニング
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = 'ガムを前後・左右で噛めない、または舌で押し付けられない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '噛めるが1分間持続できない、または上あごに広げられない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = 'ガムを前後・左右で1分間噛み、舌で上あごに広げて唾を飲み込める'
WHERE training_name = 'ガムトレーニング' AND clinic_id IS NULL;

-- 16. 下顎を前に出すトレーニング
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '下顎を前に出せない、またはイーの口ができない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '下顎を前に出せるが、切端位で噛めない、または5秒かけて開閉口できない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = 'イーの口で下顎を前に出し、切端位で噛み、5秒かけて開閉口できる'
WHERE training_name = '下顎を前に出すトレーニング' AND clinic_id IS NULL;

-- 17. 舌小帯伸ばし（新規追加）
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = '舌を上あごにつけられない、または口を開けられない',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = '舌を上あごにつけて口を開けられるが、舌小帯の伸びが不十分',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = '舌を上あごにつけながら、口を大きく開けて舌小帯を十分に伸ばせる'
WHERE training_name = '舌小帯伸ばし' AND clinic_id IS NULL;

-- 18. チューブ吸い（新規追加）
UPDATE trainings SET
    evaluation_level_1_label = 'できなかった',
    evaluation_level_1_criteria = 'チューブを吸えない、または吸引力が非常に弱い',
    evaluation_level_2_label = 'まあまあできた',
    evaluation_level_2_criteria = 'チューブを吸えるが、吸引力が弱い、または10秒持続できない',
    evaluation_level_3_label = 'できた',
    evaluation_level_3_criteria = 'チューブを強く吸い、10秒間持続できる'
WHERE training_name = 'チューブ吸い' AND clinic_id IS NULL;

-- ==========================================
-- 3. 課題マスタ投入
-- ==========================================

INSERT INTO patient_issues (code, name, category, description) VALUES
('tongue_protrusion_difficulty', '舌を前に出すことができない', '舌の動き', '舌を真っ直ぐ前に出すことが困難な状態'),
('tongue_position_difficulty', 'スポットの位置に置くことができない', '舌の位置', '舌尖をスポット（上あご前方）に正しく置けない状態'),
('tongue_suction_difficulty', '吸い上げができない', '舌の筋力', '舌を上あごに吸い上げることができない状態'),
('lip_tension_high', '口唇の緊張が強い', '口唇の状態', '口唇に過度な緊張があり、リラックスできない状態'),
('lip_closure_weak', '口唇閉鎖力が弱い', '口唇の筋力', '口唇を閉じる力が不足している状態'),
('bite_force_weak', '咬合力が弱い', '咬合', '噛む力が不足している状態');

-- ==========================================
-- 4. 課題→トレーニング紐付け投入
-- ==========================================

-- 課題1: 舌を前に出すことができない
INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'tongue_protrusion_difficulty', id, 1, '舌の左右の動きを促進し、舌の可動域を広げる'
FROM trainings WHERE training_name = '舌を左右に振る' AND clinic_id IS NULL;

INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'tongue_protrusion_difficulty', id, 2, '舌の動きの協調性を向上させる'
FROM trainings WHERE training_name = '口唇をなぞる' AND clinic_id IS NULL;

INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'tongue_protrusion_difficulty', id, 3, '舌小帯の柔軟性を向上させ、舌の前方移動を容易にする'
FROM trainings WHERE training_name = '舌小帯伸ばし' AND clinic_id IS NULL;

-- 課題2: スポットの位置に置くことができない
INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'tongue_position_difficulty', id, 1, 'スポットの位置を認識し、舌尖を正しく置く練習'
FROM trainings WHERE training_name = 'スポットの位置確認' AND clinic_id IS NULL;

-- 課題3: 吸い上げができない
INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'tongue_suction_difficulty', id, 1, '吸い上げの基本動作を習得する'
FROM trainings WHERE training_name = '吸い上げ' AND clinic_id IS NULL;

INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'tongue_suction_difficulty', id, 2, '舌の筋力を強化し、吸い上げを可能にする'
FROM trainings WHERE training_name = '舌筋の訓練' AND clinic_id IS NULL;

INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'tongue_suction_difficulty', id, 3, '吸引動作を通じて舌の筋力と協調性を向上させる'
FROM trainings WHERE training_name = 'チューブ吸い' AND clinic_id IS NULL;

-- 課題4: 口唇の緊張が強い
INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'lip_tension_high', id, 1, '小帯を伸ばすことで口唇の緊張を緩和する'
FROM trainings WHERE training_name = '上唇小帯と下唇小帯を伸ばす' AND clinic_id IS NULL;

INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'lip_tension_high', id, 2, '口唇内側に空気を入れ、緊張を除去する'
FROM trainings WHERE training_name = '口唇の緊張除去' AND clinic_id IS NULL;

-- 課題5: 口唇閉鎖力が弱い
INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'lip_closure_weak', id, 1, '口輪筋を鍛え、口唇閉鎖力を向上させる'
FROM trainings WHERE training_name = '口輪筋訓練' AND clinic_id IS NULL;

INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'lip_closure_weak', id, 2, '呼吸コントロールを通じて口唇の筋力を強化する'
FROM trainings WHERE training_name = '息吹きかけ' AND clinic_id IS NULL;

-- 課題6: 咬合力が弱い
INSERT INTO issue_training_mappings (issue_code, training_id, priority, description)
SELECT 'bite_force_weak', id, 1, '噛む動作を繰り返し、咬合力を強化する'
FROM trainings WHERE training_name = 'ガムトレーニング' AND clinic_id IS NULL;

-- ==========================================
-- 5. 評価→課題判定ルール投入
-- ==========================================

-- 「舌を前に出す」がレベル1または2 → 課題「tongue_protrusion_difficulty」
INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 1, 'tongue_protrusion_difficulty', true, '舌を前に出すことができない（レベル1）'
FROM trainings WHERE training_name = '舌を前に出す' AND clinic_id IS NULL;

INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 2, 'tongue_protrusion_difficulty', true, '舌を前に出すことが不十分（レベル2）'
FROM trainings WHERE training_name = '舌を前に出す' AND clinic_id IS NULL;

-- 「スポットの位置確認」がレベル1または2 → 課題「tongue_position_difficulty」
INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 1, 'tongue_position_difficulty', true, 'スポットの位置に置くことができない（レベル1）'
FROM trainings WHERE training_name = 'スポットの位置確認' AND clinic_id IS NULL;

INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 2, 'tongue_position_difficulty', true, 'スポットの位置に置くことが不十分（レベル2）'
FROM trainings WHERE training_name = 'スポットの位置確認' AND clinic_id IS NULL;

-- 「吸い上げ」がレベル1または2 → 課題「tongue_suction_difficulty」
INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 1, 'tongue_suction_difficulty', true, '吸い上げができない（レベル1）'
FROM trainings WHERE training_name = '吸い上げ' AND clinic_id IS NULL;

INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 2, 'tongue_suction_difficulty', true, '吸い上げが不十分（レベル2）'
FROM trainings WHERE training_name = '吸い上げ' AND clinic_id IS NULL;

-- 「口唇の緊張除去」がレベル1または2 → 課題「lip_tension_high」
INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 1, 'lip_tension_high', true, '口唇の緊張が強い（レベル1）'
FROM trainings WHERE training_name = '口唇の緊張除去' AND clinic_id IS NULL;

INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 2, 'lip_tension_high', true, '口唇の緊張がやや強い（レベル2）'
FROM trainings WHERE training_name = '口唇の緊張除去' AND clinic_id IS NULL;

-- 「口輪筋訓練」がレベル1または2 → 課題「lip_closure_weak」
INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 1, 'lip_closure_weak', true, '口唇閉鎖力が弱い（レベル1）'
FROM trainings WHERE training_name = '口輪筋訓練' AND clinic_id IS NULL;

INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 2, 'lip_closure_weak', true, '口唇閉鎖力がやや弱い（レベル2）'
FROM trainings WHERE training_name = '口輪筋訓練' AND clinic_id IS NULL;

-- 「ガムトレーニング」がレベル1または2 → 課題「bite_force_weak」
INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 1, 'bite_force_weak', true, '咬合力が弱い（レベル1）'
FROM trainings WHERE training_name = 'ガムトレーニング' AND clinic_id IS NULL;

INSERT INTO evaluation_issue_rules (training_id, evaluation_level, identified_issue_code, auto_identify, description)
SELECT id, 2, 'bite_force_weak', true, '咬合力がやや弱い（レベル2）'
FROM trainings WHERE training_name = 'ガムトレーニング' AND clinic_id IS NULL;

-- ==========================================
-- 完了
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE 'Issue and evaluation master data inserted successfully';
    RAISE NOTICE 'Added 2 new trainings: 舌小帯伸ばし, チューブ吸い';
    RAISE NOTICE 'Set evaluation criteria for all 18 trainings';
    RAISE NOTICE 'Inserted 6 patient issues';
    RAISE NOTICE 'Inserted 11 issue-training mappings';
    RAISE NOTICE 'Inserted 12 evaluation-issue rules';
END $$;
