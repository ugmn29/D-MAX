-- 簡易版問診表テンプレート
INSERT INTO system_questionnaire_templates (id, name, description, category, is_active, sort_order)
VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '簡易問診表',
  'デモ・検証用の簡易版問診表',
  'simple',
  true,
  3
) ON CONFLICT (id) DO NOTHING;

-- 簡易版問診表の質問項目
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, sort_order) VALUES
('00000000-0000-0000-0000-000000000003', '基本情報', 'お名前', 'text', NULL, true, 1),
('00000000-0000-0000-0000-000000000003', '基本情報', 'フリガナ', 'text', NULL, true, 2),
('00000000-0000-0000-0000-000000000003', '基本情報', '生年月日', 'date', NULL, true, 3),
('00000000-0000-0000-0000-000000000003', '基本情報', '性別', 'radio', '["男性", "女性", "その他"]', true, 4),
('00000000-0000-0000-0000-000000000003', '基本情報', '電話番号', 'tel', NULL, true, 5),
('00000000-0000-0000-0000-000000000003', '基本情報', 'メールアドレス', 'email', NULL, false, 6),
('00000000-0000-0000-0000-000000000003', '受診理由', 'ご来院の理由', 'textarea', NULL, true, 7),
('00000000-0000-0000-0000-000000000003', '健康状態', 'アレルギーの有無', 'radio', '["なし", "あり"]', true, 8),
('00000000-0000-0000-0000-000000000003', '健康状態', '現在服用中のお薬', 'radio', '["なし", "あり"]', true, 9);
