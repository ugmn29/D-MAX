-- システムテンプレートの健康状態セクションの修正

-- Q205: アレルギーの詳細 を削除
DELETE FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text = 'アレルギーの詳細';

-- Q211: 服用中の薬剤名 を削除
DELETE FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text = '服用中の薬剤名';

-- Q212: お薬手帳 を削除
DELETE FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text = 'お薬手帳';

-- Q209: 通院中の病院・病名 → 通院中の病院 に変更
UPDATE system_questionnaire_template_questions
SET question_text = '通院中の病院'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text = '通院中の病院・病名';

-- 元のQ208: 通院中の病院を削除（重複のため）
DELETE FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text = '通院中の病院'
AND sort_order = 208;

-- Q210: 服用中のお薬も削除
DELETE FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text = '服用中のお薬';

-- デフォルトで患者情報フィールドと連携する設定を追加

-- 基本情報セクション
UPDATE system_questionnaire_template_questions
SET linked_field = 'birth_date'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '基本情報'
AND question_text = '生年月日';

UPDATE system_questionnaire_template_questions
SET linked_field = 'gender'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '基本情報'
AND question_text = '性別';

UPDATE system_questionnaire_template_questions
SET linked_field = 'postal_code'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '基本情報'
AND question_text = '郵便番号';

UPDATE system_questionnaire_template_questions
SET linked_field = 'address'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '基本情報'
AND question_text = '住所';

UPDATE system_questionnaire_template_questions
SET linked_field = 'phone'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '基本情報'
AND question_text = '携帯電話番号';

UPDATE system_questionnaire_template_questions
SET linked_field = 'email'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '基本情報'
AND question_text = 'Eメールアドレス';

UPDATE system_questionnaire_template_questions
SET linked_field = 'referral_source'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '基本情報'
AND question_text = 'ご来院を知ったきっかけ';

-- 健康状態セクション
UPDATE system_questionnaire_template_questions
SET linked_field = 'allergies'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text = '薬・食物・金属アレルギー';

UPDATE system_questionnaire_template_questions
SET linked_field = 'medical_history'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND section_name = '健康状態'
AND question_text = '持病（複数選択可）';
