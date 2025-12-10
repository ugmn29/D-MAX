-- 問診票の質問に linked_field を追加
-- 患者情報にマッピングするために必要

-- まず、現在の質問を確認（デバッグ用）
-- SELECT id, question_text, question_type, sort_order, linked_field
-- FROM questionnaire_questions
-- ORDER BY sort_order;

-- 主要な質問に linked_field を設定
-- 注: 実際の question_text と sort_order に基づいて更新する必要があります

-- 例: 生年月日の質問
UPDATE questionnaire_questions
SET linked_field = 'birth_date'
WHERE question_text LIKE '%生年月日%'
  AND linked_field IS NULL;

-- 例: 性別の質問
UPDATE questionnaire_questions
SET linked_field = 'gender'
WHERE question_text LIKE '%性別%'
  AND linked_field IS NULL;

-- 例: 電話番号の質問（patient_phone キーを使用している場合）
UPDATE questionnaire_questions
SET linked_field = 'phone'
WHERE question_text LIKE '%電話%'
  OR question_text LIKE '%TEL%'
  AND linked_field IS NULL;

-- 例: メールアドレスの質問
UPDATE questionnaire_questions
SET linked_field = 'email'
WHERE question_text LIKE '%メール%'
  OR question_text LIKE '%mail%'
  AND linked_field IS NULL;

-- 例: アレルギーの質問
UPDATE questionnaire_questions
SET linked_field = 'allergies'
WHERE (question_text LIKE '%アレルギー%' OR question_text LIKE '%allergy%')
  AND linked_field IS NULL;

-- 例: 既往歴の質問
UPDATE questionnaire_questions
SET linked_field = 'medical_history'
WHERE (question_text LIKE '%既往歴%' OR question_text LIKE '%病歴%')
  AND linked_field IS NULL;

-- 例: 服薬情報の質問
UPDATE questionnaire_questions
SET linked_field = 'medications'
WHERE (question_text LIKE '%服薬%' OR question_text LIKE '%薬%')
  AND linked_field IS NULL;

-- 確認：更新された質問を表示
SELECT
  id,
  question_text,
  linked_field,
  sort_order
FROM questionnaire_questions
WHERE linked_field IS NOT NULL
ORDER BY sort_order;
