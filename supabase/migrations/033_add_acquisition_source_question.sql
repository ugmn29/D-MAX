-- 問診表に「来院理由」質問を追加

-- 既存の問診表テンプレートに「来院理由」質問を追加する関数
CREATE OR REPLACE FUNCTION add_acquisition_source_question_to_questionnaires()
RETURNS void AS $$
DECLARE
  questionnaire_record RECORD;
  max_sort_order INTEGER;
  acquisition_question_id UUID;
BEGIN
  -- 全ての問診表テンプレートに対して来院理由の質問を追加
  FOR questionnaire_record IN
    SELECT id FROM questionnaires
  LOOP
    -- 既に来院理由の質問が存在するかチェック
    IF NOT EXISTS (
      SELECT 1 FROM questionnaire_questions
      WHERE questionnaire_id = questionnaire_record.id
      AND question_text LIKE '%当院を知ったきっかけ%'
    ) THEN
      -- 現在の最大sort_orderを取得
      SELECT COALESCE(MAX(sort_order), 0) INTO max_sort_order
      FROM questionnaire_questions
      WHERE questionnaire_id = questionnaire_record.id;

      -- 来院理由の質問を追加してIDを取得
      INSERT INTO questionnaire_questions (
        questionnaire_id,
        section_name,
        question_text,
        question_type,
        is_required,
        sort_order,
        options,
        conditional_logic,
        created_at,
        updated_at
      ) VALUES (
        questionnaire_record.id,
        '来院動機',
        '当院を知ったきっかけを教えてください',
        'radio',
        true,
        max_sort_order + 1,
        jsonb_build_array(
          'Instagram広告',
          'Google広告',
          'Yahoo広告',
          'TikTok広告',
          'Google検索（自然検索）',
          'ホームページ',
          'SNS（Instagram・X・Facebookなど）',
          '看板',
          '紹介（友人・知人）',
          '紹介（他院）',
          '以前から知っていた',
          'その他'
        ),
        NULL,
        NOW(),
        NOW()
      )
      RETURNING id INTO acquisition_question_id;

      -- 「その他」選択時の詳細入力欄を追加
      INSERT INTO questionnaire_questions (
        questionnaire_id,
        section_name,
        question_text,
        question_type,
        is_required,
        sort_order,
        options,
        conditional_logic,
        created_at,
        updated_at
      ) VALUES (
        questionnaire_record.id,
        '来院動機',
        '具体的に教えてください',
        'text',
        true,
        max_sort_order + 2,
        NULL,
        jsonb_build_object(
          'depends_on', acquisition_question_id::text,
          'condition', 'equals',
          'value', 'その他',
          'required_when', true
        ),
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 関数を実行して全問診表に来院理由質問を追加
SELECT add_acquisition_source_question_to_questionnaires();

-- 関数を削除（一度きりの実行なので）
DROP FUNCTION add_acquisition_source_question_to_questionnaires();

-- コメント
COMMENT ON COLUMN questionnaire_questions.question_text IS '質問文 - 来院理由質問も含む';
COMMENT ON COLUMN questionnaire_questions.options IS '選択肢（JSON配列） - 来院理由の選択肢も含む';
