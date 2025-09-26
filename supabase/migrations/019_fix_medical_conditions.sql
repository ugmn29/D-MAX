-- 持病・通院中の病気の選択肢を修正
-- 現在の選択肢を更新して、より詳細な選択肢に変更

UPDATE questionnaire_questions 
SET options = '["高血圧", "糖尿病", "心血管疾患・不整脈（6ヶ月以内の発作の有無、ペースメーカーの有無）", "脳血管障害（6ヶ月以内の発作の有無）", "呼吸器疾患", "骨粗しょう症", "リウマチ", "肝機能障害", "腎機能障害（透析の有無、曜日、腕の左右）", "B型・C型肝炎", "HIV・梅毒", "血液疾患", "悪性腫瘍（放射線治療または抗がん剤治療の経験の有無）", "その他"]'::jsonb
WHERE questionnaire_id = '11111111-1111-1111-1111-111111111112' 
AND question_text = '具体的な持病';

-- 持病・通院中の病気の質問文も確認・修正
UPDATE questionnaire_questions 
SET question_text = '持病・通院中の病気'
WHERE questionnaire_id = '11111111-1111-1111-1111-111111111112' 
AND question_text = '持病・通院中の病気';

-- 病名・病院名・診療科・医師名の質問文も確認・修正
UPDATE questionnaire_questions 
SET question_text = '（病名、病院名/診療科/医師名を記入）'
WHERE questionnaire_id = '11111111-1111-1111-1111-111111111112' 
AND question_text = '病名・病院名・診療科・医師名';
