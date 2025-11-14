-- アレルギー詳細フィールドを条件付きで追加
-- 「薬・食物・金属アレルギー」で「ある」が選択された場合のみ表示

-- システムテンプレートにアレルギー詳細を追加（条件付き）
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
  '健康状態',
  'アレルギーの詳細',
  'textarea',
  NULL,
  false,
  205,
  jsonb_build_object(
    'show_when', jsonb_build_object(
      'question_text', '薬・食物・金属アレルギー',
      'value', 'ある',
      'operator', 'contains'
    )
  ),
  NULL
) ON CONFLICT DO NOTHING;

-- 既存の問診票にもアレルギー詳細を追加
DO $$
DECLARE
  questionnaire_record RECORD;
BEGIN
  -- 各問診票に対して処理
  FOR questionnaire_record IN
    SELECT DISTINCT q.id, q.clinic_id
    FROM questionnaires q
    INNER JOIN questionnaire_questions qq ON q.id = qq.questionnaire_id
    WHERE qq.question_text = '薬・食物・金属アレルギー'
  LOOP
    -- アレルギー詳細の質問を追加（既に存在しない場合のみ）
    INSERT INTO questionnaire_questions (
      questionnaire_id,
      section_name,
      question_text,
      question_type,
      options,
      is_required,
      sort_order,
      conditional_logic,
      linked_field
    )
    SELECT
      questionnaire_record.id,
      '健康状態',
      'アレルギーの詳細',
      'textarea',
      NULL,
      false,
      205,
      jsonb_build_object(
        'show_when', jsonb_build_object(
          'question_text', '薬・食物・金属アレルギー',
          'value', 'ある',
          'operator', 'contains'
        )
      ),
      NULL
    WHERE NOT EXISTS (
      SELECT 1
      FROM questionnaire_questions
      WHERE questionnaire_id = questionnaire_record.id
      AND question_text = 'アレルギーの詳細'
    );

    RAISE NOTICE '問診票 % にアレルギー詳細を追加しました', questionnaire_record.id;
  END LOOP;
END $$;
