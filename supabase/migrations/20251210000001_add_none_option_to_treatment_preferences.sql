-- 標準問診表の「該当する項目」に「何も該当しない」選択肢を追加

-- system_questionnaire_template_questionsテーブルを更新
UPDATE system_questionnaire_template_questions
SET options = '["舌や歯茎に触れると吐き気が出やすい", "むせやすい", "口を長時間開けていられない", "口を大きく開けられない", "椅子を倒すのがツラい", "宗教・思想的観点から使用できない医療製品がある", "小児や障がいをお持ちの方で、安全のため身体を抑制する必要がある", "何も該当しない"]'
WHERE template_id = '00000000-0000-0000-0000-000000000001'
  AND section_name = '治療の希望'
  AND question_text = '該当する項目（複数選択可）'
  AND sort_order = 305;

-- 既存のクリニック問診表も更新（template_idが標準問診表のもの）
UPDATE questionnaire_questions
SET options = '["舌や歯茎に触れると吐き気が出やすい", "むせやすい", "口を長時間開けていられない", "口を大きく開けられない", "椅子を倒すのがツラい", "宗教・思想的観点から使用できない医療製品がある", "小児や障がいをお持ちの方で、安全のため身体を抑制する必要がある", "何も該当しない"]'
WHERE questionnaire_id IN (
  SELECT id FROM questionnaires
  WHERE template_id = '00000000-0000-0000-0000-000000000001'
)
AND section_name = '治療の希望'
AND question_text = '該当する項目（複数選択可）';
