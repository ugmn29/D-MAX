-- 標準問診表の電話番号フィールドを更新
-- 「自宅電話番号」と「携帯電話番号」の質問を削除して、
-- 「電話番号の入力形式」ラジオボタンと条件付きフィールドを追加

-- まず既存の電話番号関連の質問を削除
DELETE FROM system_questionnaire_template_questions
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND question_text IN ('自宅電話番号', '携帯電話番号');

-- 新しい電話番号フィールドを追加
-- sort_order 9: 電話番号の入力形式（ラジオボタン）
INSERT INTO system_questionnaire_template_questions (
  template_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  linked_field
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '基本情報',
  '電話番号の入力形式',
  'radio',
  '["携帯のみ", "両方"]',
  true,
  9,
  NULL
);

-- sort_order 10: 自宅電話番号（条件付き: 「両方」選択時のみ表示）
INSERT INTO system_questionnaire_template_questions (
  template_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  conditional_logic,
  linked_field
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '基本情報',
  '自宅電話番号',
  'tel',
  NULL,
  false,
  10,
  jsonb_build_object(
    'show_when', jsonb_build_object(
      'question_text', '電話番号の入力形式',
      'value', '両方'
    )
  ),
  'home_phone'
);

-- sort_order 11: 携帯電話番号（常に表示）
INSERT INTO system_questionnaire_template_questions (
  template_id,
  section_name,
  question_text,
  question_type,
  options,
  is_required,
  sort_order,
  linked_field
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '基本情報',
  '携帯電話番号',
  'tel',
  NULL,
  true,
  11,
  'phone'
);

-- Eメールアドレスのsort_orderを12に更新
UPDATE system_questionnaire_template_questions
SET sort_order = 12
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND question_text = 'Eメールアドレス';

-- 希望連絡先のsort_orderを14に更新
UPDATE system_questionnaire_template_questions
SET sort_order = 14
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND question_text = '希望連絡先';

-- ご来院を知ったきっかけのsort_orderを15に更新
UPDATE system_questionnaire_template_questions
SET sort_order = 15
WHERE template_id = '00000000-0000-0000-0000-000000000001'
AND question_text = 'ご来院を知ったきっかけ';
