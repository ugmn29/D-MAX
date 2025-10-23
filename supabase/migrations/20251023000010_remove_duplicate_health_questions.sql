-- システムテンプレートから重複する健康状態の質問を削除

-- Q209: 通院中の病院・病名 (Q208と重複)
DELETE FROM system_questionnaire_template_questions
WHERE id = 'ed849926-0dfb-40d4-84e2-54cfd4acd8e4';

-- Q210: 服用中のお薬 (Q211と重複)
DELETE FROM system_questionnaire_template_questions
WHERE id = '14d4958d-2e07-450c-8622-47c4edb4de7c';

-- Q212: お薬手帳 (不要)
DELETE FROM system_questionnaire_template_questions
WHERE id = '9b4a58e7-16c0-4309-929d-32e22b39f9f7';
