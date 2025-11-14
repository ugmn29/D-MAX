-- 紹介者名フィールドを追加
-- 「ご来院を知ったきっかけ」で「ご紹介」が選択された場合のみ表示

-- システムテンプレートに紹介者名を追加
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
  '紹介者名',
  'text',
  NULL,
  false,
  16,
  jsonb_build_object(
    'show_when', jsonb_build_object(
      'question_text', 'ご来院を知ったきっかけ',
      'value', 'ご紹介',
      'operator', 'contains'
    )
  ),
  NULL
) ON CONFLICT DO NOTHING;

-- 既存の問診票にも紹介者名を追加
-- まず、「ご来院を知ったきっかけ」の質問IDを取得
DO $$
DECLARE
  questionnaire_record RECORD;
  referral_question_id UUID;
BEGIN
  -- 各問診票に対して処理
  FOR questionnaire_record IN
    SELECT DISTINCT q.id, q.clinic_id
    FROM questionnaires q
    INNER JOIN questionnaire_questions qq ON q.id = qq.questionnaire_id
    WHERE qq.question_text = 'ご来院を知ったきっかけ'
  LOOP
    -- 「ご来院を知ったきっかけ」の質問IDを取得
    SELECT id INTO referral_question_id
    FROM questionnaire_questions
    WHERE questionnaire_id = questionnaire_record.id
    AND question_text = 'ご来院を知ったきっかけ';

    -- 紹介者名の質問を追加（既に存在しない場合のみ）
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
      '基本情報',
      '紹介者名',
      'text',
      NULL,
      false,
      16,
      jsonb_build_object(
        'show_when', jsonb_build_object(
          'question_text', 'ご来院を知ったきっかけ',
          'value', 'ご紹介',
          'operator', 'contains'
        )
      ),
      NULL
    WHERE NOT EXISTS (
      SELECT 1
      FROM questionnaire_questions
      WHERE questionnaire_id = questionnaire_record.id
      AND question_text = '紹介者名'
    );

    RAISE NOTICE '問診票 % に紹介者名を追加しました', questionnaire_record.id;
  END LOOP;
END $$;
