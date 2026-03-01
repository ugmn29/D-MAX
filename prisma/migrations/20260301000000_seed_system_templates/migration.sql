-- system_cancel_reasons
INSERT INTO system_cancel_reasons (name, description, sort_order, is_active) VALUES
  ('患者都合', '患者様のご都合によるキャンセル', 1, true),
  ('体調不良', '患者様の体調不良によるキャンセル', 2, true),
  ('仕事・学校', '仕事や学校の都合によるキャンセル', 3, true),
  ('家庭の事情', '家庭の事情によるキャンセル', 4, true),
  ('天候不良', '天候不良によるキャンセル', 5, true),
  ('交通事情', '交通事情によるキャンセル', 6, true),
  ('無断キャンセル', '連絡なしのキャンセル', 7, true),
  ('医院都合', '医院側の都合によるキャンセル', 8, true),
  ('その他', 'その他の理由', 9, true)
ON CONFLICT DO NOTHING;

-- system_notification_templates
INSERT INTO system_notification_templates (id, name, notification_type, message_template, line_message, email_subject, email_message, sms_message, default_timing_value, default_timing_unit, sort_order, is_active) VALUES ('00000000-0000-0000-0003-000000000005', 'LINE連携完了通知', 'custom', '{{patient_name}}様

{{clinic_name}}のLINE公式アカウントへようこそ！
連携が完了しました。

■LINEで利用できる機能
📱 診察券（QRコード）
　受付でQRコードを表示するだけでOK

📅 予約の確認・変更
　24時間いつでも予約確認・変更が可能

👨‍👩‍👧‍👦 家族の登録
　ご家族の予約も一緒に管理できます

💬 お問い合わせ
　診療時間や治療内容などお気軽にご質問ください

下のリッチメニューからご利用いただけます。
今後ともよろしくお願いいたします。

{{clinic_name}}', '{{patient_name}}様

{{clinic_name}}のLINE公式アカウントへようこそ！
連携が完了しました。

■LINEで利用できる機能
📱 診察券（QRコード）
　受付でQRコードを表示するだけでOK

📅 予約の確認・変更
　24時間いつでも予約確認・変更が可能

👨‍👩‍👧‍👦 家族の登録
　ご家族の予約も一緒に管理できます

💬 お問い合わせ
　診療時間や治療内容などお気軽にご質問ください

下のリッチメニューからご利用いただけます。
今後ともよろしくお願いいたします。

{{clinic_name}}', NULL, NULL, NULL, 3, 'days', 5, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO system_notification_templates (id, name, notification_type, message_template, line_message, email_subject, email_message, sms_message, default_timing_value, default_timing_unit, sort_order, is_active) VALUES ('00000000-0000-0000-0003-000000000002', '予約リマインド', 'appointment_reminder', '{{patient_name}}様

{{clinic_name}}です。
{{appointment_date}}のご予約のリマインドです。

■ご予約内容
日時：{{appointment_datetime}}
治療内容：{{treatment_name}}
担当医：{{staff_name}}

【ご来院前のお願い】
・歯磨きをしてご来院ください
・保険証をお持ちください

キャンセルされる場合は、お早めにご連絡ください。

{{clinic_name}}
TEL: {{clinic_phone}}', '{{patient_name}}様

{{clinic_name}}です。
{{appointment_date}}のご予約のリマインドです。

■ご予約内容
日時：{{appointment_datetime}}
治療内容：{{treatment_name}}
担当医：{{staff_name}}

【ご来院前のお願い】
・歯磨きをしてご来院ください
・保険証をお持ちください

キャンセルされる場合は、お早めにご連絡ください。

{{clinic_name}}
TEL: {{clinic_phone}}', '【{{clinic_name}}】ご予約のリマインド', '{{patient_name}}様

{{clinic_name}}です。
{{appointment_date}}のご予約のリマインドです。

■ご予約内容
日時：{{appointment_datetime}}
治療内容：{{treatment_name}}
担当医：{{staff_name}}

■アクセス
{{clinic_address}}
TEL: {{clinic_phone}}

■ご来院前のお願い
・保険証をお持ちください
・歯磨きをしてご来院いただけると幸いです

キャンセルされる場合は、お早めにご連絡ください。

ご来院をお待ちしております。

{{clinic_name}}
TEL: {{clinic_phone}}', '{{patient_name}}様 {{appointment_date}}{{appointment_time}}のご予約です。{{clinic_name}}', 1, 'days', 2, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO system_notification_templates (id, name, notification_type, message_template, line_message, email_subject, email_message, sms_message, default_timing_value, default_timing_unit, sort_order, is_active) VALUES ('00000000-0000-0000-0003-000000000001', '予約確定通知', 'appointment_reminder', '{{patient_name}}様

ご予約ありがとうございます。

■ご予約内容
日時：{{appointment_datetime}}
治療内容：{{treatment_name}}
担当医：{{staff_name}}

ご来院をお待ちしております。

【キャンセル・変更について】
やむを得ずキャンセルされる場合は、お早めにご連絡ください。
LINEのリッチメニュー「予約確認」からも変更可能です。

{{clinic_name}}', '{{patient_name}}様

ご予約ありがとうございます。

■ご予約内容
日時：{{appointment_datetime}}
治療内容：{{treatment_name}}
担当医：{{staff_name}}

ご来院をお待ちしております。

【キャンセル・変更について】
やむを得ずキャンセルされる場合は、お早めにご連絡ください。
LINEのリッチメニュー「予約確認」からも変更可能です。

{{clinic_name}}', '【{{clinic_name}}】ご予約確定のお知らせ', '{{patient_name}}様

いつもありがとうございます。
{{clinic_name}}です。

ご予約を承りました。

■ご予約内容
日時：{{appointment_datetime}}
治療内容：{{treatment_name}}
担当医：{{staff_name}}

■アクセス
{{clinic_address}}
TEL: {{clinic_phone}}

■ご来院時のお願い
・保険証をお持ちください
・歯磨きをしてご来院いただけると幸いです

【キャンセル・変更について】
やむを得ずキャンセルされる場合は、前日までにご連絡ください。

ご来院をお待ちしております。

{{clinic_name}}
TEL: {{clinic_phone}}', '{{patient_name}}様 {{appointment_date}}{{appointment_time}}のご予約を承りました。{{clinic_name}}', 3, 'days', 1, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO system_notification_templates (id, name, notification_type, message_template, line_message, email_subject, email_message, sms_message, default_timing_value, default_timing_unit, sort_order, is_active) VALUES ('00000000-0000-0000-0003-000000000003', '定期検診リマインド', 'periodic_checkup', '{{patient_name}}様

{{clinic_name}}です。
前回のご来院から3ヶ月が経過しました。

お口の健康を保つため、3〜6ヶ月ごとの定期検診をお勧めしております。

■定期検診の内容
・虫歯チェック
・歯石除去（クリーニング）
・歯周病チェック
・ブラッシング指導

ご予約はリッチメニューの「予約確認」から、または下記URLからお願いいたします。

{{booking_url}}

{{clinic_name}}
TEL: {{clinic_phone}}', '{{patient_name}}様

{{clinic_name}}です。
前回のご来院から3ヶ月が経過しました。

お口の健康を保つため、3〜6ヶ月ごとの定期検診をお勧めしております。

■定期検診の内容
・虫歯チェック
・歯石除去（クリーニング）
・歯周病チェック
・ブラッシング指導

ご予約はリッチメニューの「予約確認」から、または下記URLからお願いいたします。

{{booking_url}}

{{clinic_name}}
TEL: {{clinic_phone}}', '【{{clinic_name}}】定期検診のご案内', '{{patient_name}}様

いつもありがとうございます。
{{clinic_name}}です。

前回のご来院から3ヶ月が経過しました。

お口の健康を保つため、定期的な検診をお勧めしております。

■定期検診の重要性
虫歯や歯周病は、初期段階では自覚症状がほとんどありません。
定期検診により早期発見・早期治療が可能となり、歯の寿命を延ばすことができます。

■定期検診の内容
・虫歯チェック
・歯石除去（クリーニング）
・歯周病チェック
・ブラッシング指導
・フッ素塗布（希望者）

所要時間：30分〜45分程度

ご予約は下記URLまたはお電話でお願いいたします。
{{booking_url}}

{{clinic_name}}
TEL: {{clinic_phone}}', '{{patient_name}}様 定期検診のご案内です。ご予約お待ちしております。{{clinic_name}} {{clinic_phone}}', 3, 'months', 3, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO system_notification_templates (id, name, notification_type, message_template, line_message, email_subject, email_message, sms_message, default_timing_value, default_timing_unit, sort_order, is_active) VALUES ('00000000-0000-0000-0003-000000000004', '治療リマインド', 'treatment_reminder', '{{patient_name}}様

{{clinic_name}}です。
前回の治療から1ヶ月が経過しました。

継続治療が必要な場合がございますので、
ご予約をお願いいたします。

■前回の治療内容
{{treatment_name}}

■ご予約について
リッチメニューの「予約確認」または下記URLからご予約いただけます。
{{booking_url}}

{{clinic_name}}
TEL: {{clinic_phone}}', '{{patient_name}}様

{{clinic_name}}です。
前回の治療から1ヶ月が経過しました。

継続治療が必要な場合がございますので、
ご予約をお願いいたします。

■前回の治療内容
{{treatment_name}}

■ご予約について
リッチメニューの「予約確認」または下記URLからご予約いただけます。
{{booking_url}}

{{clinic_name}}
TEL: {{clinic_phone}}', '【{{clinic_name}}】治療のご案内', '{{patient_name}}様

いつもありがとうございます。
{{clinic_name}}です。

前回の治療から1ヶ月が経過しました。

■前回の治療内容
{{treatment_name}}

継続治療が必要な場合がございますので、
お早めのご来院をお勧めいたします。

■ご予約について
下記URLまたはお電話でご予約をお願いいたします。
{{booking_url}}

{{clinic_name}}
TEL: {{clinic_phone}}', '{{patient_name}}様 治療のご案内です。ご予約お待ちしております。{{clinic_name}} {{clinic_phone}}', 1, 'months', 4, true) ON CONFLICT (id) DO NOTHING;

-- system_questionnaire_templates
INSERT INTO system_questionnaire_templates (id, name, description, is_active, sort_order) VALUES ('00000000-0000-0000-0004-000000000001', '標準問診表', 'null', true, 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO system_questionnaire_templates (id, name, description, is_active, sort_order) VALUES ('00000000-0000-0000-0004-000000000002', '簡易問診表', 'デモ・検証用の簡易版問診表', true, 2) ON CONFLICT (id) DO NOTHING;
INSERT INTO system_questionnaire_templates (id, name, description, is_active, sort_order) VALUES ('00000000-0000-0000-0004-000000000003', '習慣チェック表', 'null', true, 3) ON CONFLICT (id) DO NOTHING;

-- system_questionnaire_template_questions
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '受診日', 'date', NULL, true, NULL, 1, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '受診日', 'date', NULL, true, NULL, 1, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '氏名', 'text', NULL, true, NULL, 2, 'name', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '氏名', 'text', NULL, true, NULL, 2, 'name', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', 'フリガナ', 'text', NULL, true, NULL, 3, 'furigana_kana', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', 'フリガナ', 'text', NULL, true, NULL, 3, 'furigana_kana', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '生年月日', 'date', NULL, true, NULL, 4, 'birth_date', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '生年月日', 'date', NULL, true, NULL, 4, 'birth_date', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '性別', 'radio', '["男性","女性","その他"]'::jsonb, true, NULL, 5, 'gender', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '性別', 'radio', '["男性","女性","その他"]'::jsonb, true, NULL, 5, 'gender', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '血液型', 'select', '["A型","B型","O型","AB型","不明"]'::jsonb, true, NULL, 6, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '血液型', 'select', '["A型","B型","O型","AB型","不明"]'::jsonb, true, NULL, 6, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '郵便番号', 'text', NULL, true, NULL, 7, 'postal_code', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '郵便番号', 'text', NULL, true, NULL, 7, 'postal_code', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '住所', 'text', NULL, true, NULL, 8, 'address', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '住所', 'text', NULL, true, NULL, 8, 'address', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '電話番号の入力形式', 'radio', '["携帯のみ","両方"]'::jsonb, true, NULL, 9, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '電話番号の入力形式', 'radio', '["携帯のみ","両方"]'::jsonb, true, NULL, 9, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '自宅電話番号', 'tel', NULL, false, '{"show_when":{"value":"両方","question_text":"電話番号の入力形式"}}'::jsonb, 10, 'home_phone', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '自宅電話番号', 'tel', NULL, false, '{"show_when":{"value":"両方","question_text":"電話番号の入力形式"}}'::jsonb, 10, 'home_phone', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '携帯電話番号', 'tel', NULL, true, NULL, 11, 'phone', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '携帯電話番号', 'tel', NULL, true, NULL, 11, 'phone', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', 'Eメールアドレス', 'text', NULL, true, NULL, 12, 'email', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', 'Eメールアドレス', 'text', NULL, true, NULL, 12, 'email', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '希望連絡先', 'radio', '["LINE","メール","SMS","指定なし"]'::jsonb, true, NULL, 14, 'preferred_contact_method', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '希望連絡先', 'radio', '["LINE","メール","SMS","指定なし"]'::jsonb, true, NULL, 14, 'preferred_contact_method', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', 'ご来院を知ったきっかけ', 'checkbox', '["Google検索","HP","Google Map","Epark","Instagram","YouTube","看板","ご紹介","その他"]'::jsonb, true, NULL, 15, 'referral_source', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', 'ご来院を知ったきっかけ', 'checkbox', '["Google検索","HP","Google Map","Epark","Instagram","YouTube","看板","ご紹介","その他"]'::jsonb, true, NULL, 15, 'referral_source', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '紹介者名', 'text', NULL, false, '{"show_when":{"value":"ご紹介","operator":"contains","question_text":"ご来院を知ったきっかけ"}}'::jsonb, 16, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '基本情報', '紹介者名', 'text', NULL, false, '{"show_when":{"value":"ご紹介","operator":"contains","question_text":"ご来院を知ったきっかけ"}}'::jsonb, 16, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '受診理由', 'どうなさいましたか（複数選択可）', 'checkbox', '["虫歯の治療をしたい","検査をしてほしい","歯がしみる","入れ歯をいれたい","歯がかけた","歯肉が腫れた","歯の清掃をしたい","前につめた物がとれた","顎関節が痛む","親知らずを抜きたい","口内炎が出来た","その他"]'::jsonb, true, NULL, 101, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '受診理由', 'どうなさいましたか（複数選択可）', 'checkbox', '["虫歯の治療をしたい","検査をしてほしい","歯がしみる","入れ歯をいれたい","歯がかけた","歯肉が腫れた","歯の清掃をしたい","前につめた物がとれた","顎関節が痛む","親知らずを抜きたい","口内炎が出来た","その他"]'::jsonb, true, NULL, 101, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '受診理由', '痛む箇所（複数選択可）', 'checkbox', '["右上歯","上前歯","左上歯","右下歯","下前歯","左下歯","舌","歯肉","頰","顎","唇","現在は痛みはない"]'::jsonb, true, NULL, 102, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '受診理由', '痛む箇所（複数選択可）', 'checkbox', '["右上歯","上前歯","左上歯","右下歯","下前歯","左下歯","舌","歯肉","頰","顎","唇","現在は痛みはない"]'::jsonb, true, NULL, 102, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '受診理由', 'いつから痛みますか', 'radio', '["今日初めて","昨日から","時々","数日前から","ずっと前から"]'::jsonb, true, '{"show_when":{"value":"現在は痛みはない","operator":"not_contains","question_text":"痛む箇所（複数選択可）"}}'::jsonb, 103, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '受診理由', 'いつから痛みますか', 'radio', '["今日初めて","昨日から","時々","数日前から","ずっと前から"]'::jsonb, true, '{"show_when":{"value":"現在は痛みはない","operator":"not_contains","question_text":"痛む箇所（複数選択可）"}}'::jsonb, 103, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '受診理由', '痛み方は（複数選択可）', 'checkbox', '["ズキズキ","噛んだ時に痛む","痛んだり止んだり","冷たい物がしみる","熱い物がしみる","夜になると痛む","甘い物で痛む","物が挟まって痛む"]'::jsonb, true, '{"show_when":{"value":"現在は痛みはない","operator":"not_contains","question_text":"痛む箇所（複数選択可）"}}'::jsonb, 104, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '受診理由', '痛み方は（複数選択可）', 'checkbox', '["ズキズキ","噛んだ時に痛む","痛んだり止んだり","冷たい物がしみる","熱い物がしみる","夜になると痛む","甘い物で痛む","物が挟まって痛む"]'::jsonb, true, '{"show_when":{"value":"現在は痛みはない","operator":"not_contains","question_text":"痛む箇所（複数選択可）"}}'::jsonb, 104, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '身長（cm）', 'number', NULL, true, NULL, 201, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '身長（cm）', 'number', NULL, true, NULL, 201, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '体重（kg）', 'number', NULL, true, NULL, 202, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '体重（kg）', 'number', NULL, true, NULL, 202, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '麻酔・抜歯時の異常', 'radio', '["ない","ある（麻酔が効かなかった）","ある（気分が悪くなる）","ある（血が止まらない）"]'::jsonb, true, NULL, 203, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '麻酔・抜歯時の異常', 'radio', '["ない","ある（麻酔が効かなかった）","ある（気分が悪くなる）","ある（血が止まらない）"]'::jsonb, true, NULL, 203, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '薬・食物・金属アレルギー', 'radio', '["ない","ある"]'::jsonb, true, NULL, 204, 'allergies', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '薬・食物・金属アレルギー', 'radio', '["ない","ある"]'::jsonb, true, NULL, 204, 'allergies', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', 'アレルギーの詳細', 'textarea', NULL, false, '{"show_when":{"value":"ある","operator":"contains","question_text":"薬・食物・金属アレルギー"}}'::jsonb, 205, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', 'アレルギーの詳細', 'textarea', NULL, false, '{"show_when":{"value":"ある","operator":"contains","question_text":"薬・食物・金属アレルギー"}}'::jsonb, 205, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '持病（複数選択可）', 'checkbox', '["高血圧","糖尿病","心血管疾患・不整脈","呼吸器疾患","骨粗しょう症","リウマチ","肝機能障害","腎機能障害","B型・C型肝炎","HIV・梅毒","血液疾患","悪性腫瘍","その他","なし"]'::jsonb, true, NULL, 206, 'medical_history', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '持病（複数選択可）', 'checkbox', '["高血圧","糖尿病","心血管疾患・不整脈","呼吸器疾患","骨粗しょう症","リウマチ","肝機能障害","腎機能障害","B型・C型肝炎","HIV・梅毒","血液疾患","悪性腫瘍","その他","なし"]'::jsonb, true, NULL, 206, 'medical_history', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '骨粗鬆症の治療経験', 'radio', '["ない","ある（半年ごとの注射を含む）"]'::jsonb, true, NULL, 207, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '骨粗鬆症の治療経験', 'radio', '["ない","ある（半年ごとの注射を含む）"]'::jsonb, true, NULL, 207, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '通院中の病院・病名（病院名も記載してください）', 'textarea', NULL, true, NULL, 209, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '通院中の病院・病名（病院名も記載してください）', 'textarea', NULL, true, NULL, 209, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '服用中のお薬', 'radio', '["ない","ある"]'::jsonb, true, NULL, 210, 'medications', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '服用中のお薬', 'radio', '["ない","ある"]'::jsonb, true, NULL, 210, 'medications', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '服用中の薬剤名', 'textarea', NULL, true, NULL, 211, 'medications', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '服用中の薬剤名', 'textarea', NULL, true, NULL, 211, 'medications', NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '定期的な点滴・注射（予防接種以外）', 'radio', '["無","有"]'::jsonb, true, NULL, 213, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '定期的な点滴・注射（予防接種以外）', 'radio', '["無","有"]'::jsonb, true, NULL, 213, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '妊娠・授乳', 'radio', '["いいえ","妊娠中（0-15週）","妊娠中（16-27週）","妊娠中（28週以降）","授乳中"]'::jsonb, true, NULL, 214, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '健康状態', '妊娠・授乳', 'radio', '["いいえ","妊娠中（0-15週）","妊娠中（16-27週）","妊娠中（28週以降）","授乳中"]'::jsonb, true, NULL, 214, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '治療費と材料の優先順位', 'radio', '["保険の範囲内で治してほしい","保険にこだわらず、最高の技術と材料で治してほしい","なるべく保険の範囲内、効かないところは治療内容の説明を希望する"]'::jsonb, true, NULL, 301, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '治療費と材料の優先順位', 'radio', '["保険の範囲内で治してほしい","保険にこだわらず、最高の技術と材料で治してほしい","なるべく保険の範囲内、効かないところは治療内容の説明を希望する"]'::jsonb, true, NULL, 301, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '治療の進め方', 'radio', '["悪いところは全部治したい","今回は応急処置だけ"]'::jsonb, true, NULL, 302, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '治療の進め方', 'radio', '["悪いところは全部治したい","今回は応急処置だけ"]'::jsonb, true, NULL, 302, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '歯科治療は怖い・痛いと思いますか', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 303, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '歯科治療は怖い・痛いと思いますか', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 303, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '現在の歯並びが気になりますか', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 304, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '現在の歯並びが気になりますか', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 304, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '該当する項目（複数選択可）', 'checkbox', '["舌や歯茎に触れると吐き気が出やすい","むせやすい","口を長時間開けていられない","口を大きく開けられない","椅子を倒すのがツラい","宗教・思想的観点から使用できない医療製品がある","小児や障がいをお持ちの方で、安全のため身体を抑制する必要がある","何も該当しない"]'::jsonb, true, NULL, 305, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', '該当する項目（複数選択可）', 'checkbox', '["舌や歯茎に触れると吐き気が出やすい","むせやすい","口を長時間開けていられない","口を大きく開けられない","椅子を倒すのがツラい","宗教・思想的観点から使用できない医療製品がある","小児や障がいをお持ちの方で、安全のため身体を抑制する必要がある","何も該当しない"]'::jsonb, true, NULL, 305, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', 'その他要望等', 'textarea', NULL, true, NULL, 306, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '治療の希望', 'その他要望等', 'textarea', NULL, true, NULL, 306, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', 'ご職業', 'select', '["会社員","自営業","公務員","パート・アルバイト","学生","無職","その他"]'::jsonb, true, NULL, 401, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', 'ご職業', 'select', '["会社員","自営業","公務員","パート・アルバイト","学生","無職","その他"]'::jsonb, true, NULL, 401, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '通勤・勤務中のけが', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 402, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '通勤・勤務中のけが', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 402, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '歯の色が気になりますか', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 403, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '歯の色が気になりますか', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 403, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '白い歯（セラミック等）の説明を受けたことがありますか', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 404, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '白い歯（セラミック等）の説明を受けたことがありますか', 'radio', '["はい","いいえ"]'::jsonb, true, NULL, 404, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '喫煙習慣', 'radio', '["無","有","過去に有り"]'::jsonb, true, NULL, 405, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '喫煙習慣', 'radio', '["無","有","過去に有り"]'::jsonb, true, NULL, 405, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '1日の喫煙本数', 'select', '["0本","1-5本","6-10本","11-20本","21-30本","31本以上"]'::jsonb, true, NULL, 406, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '1日の喫煙本数', 'select', '["0本","1-5本","6-10本","11-20本","21-30本","31本以上"]'::jsonb, true, NULL, 406, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '習慣的飲料物（複数選択可）', 'checkbox', '["炭酸飲料","ジュース","その他"]'::jsonb, true, NULL, 407, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '習慣的飲料物（複数選択可）', 'checkbox', '["炭酸飲料","ジュース","その他"]'::jsonb, true, NULL, 407, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '間食の取り方', 'radio', '["しない","規則正しい","不規則"]'::jsonb, true, NULL, 408, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '間食の取り方', 'radio', '["しない","規則正しい","不規則"]'::jsonb, true, NULL, 408, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '1日の歯磨き回数', 'select', '["0回","1回","2回","3回","4回以上"]'::jsonb, true, NULL, 409, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '1日の歯磨き回数', 'select', '["0回","1回","2回","3回","4回以上"]'::jsonb, true, NULL, 409, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '歯磨きの時間（複数選択可）', 'checkbox', '["朝食後","昼食後","夕食後","就寝前"]'::jsonb, true, NULL, 410, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '歯磨きの時間（複数選択可）', 'checkbox', '["朝食後","昼食後","夕食後","就寝前"]'::jsonb, true, NULL, 410, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '歯口清掃器具の使用（複数選択可）', 'checkbox', '["歯ブラシ","フロス","歯間ブラシ","なし"]'::jsonb, true, NULL, 411, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '歯口清掃器具の使用（複数選択可）', 'checkbox', '["歯ブラシ","フロス","歯間ブラシ","なし"]'::jsonb, true, NULL, 411, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '歯磨き方法', 'radio', '["習ったことがある","習ったことがない"]'::jsonb, true, NULL, 412, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '歯磨き方法', 'radio', '["習ったことがある","習ったことがない"]'::jsonb, true, NULL, 412, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '睡眠時間', 'radio', '["十分","やや不足","不足"]'::jsonb, true, NULL, 413, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '生活習慣', '睡眠時間', 'radio', '["十分","やや不足","不足"]'::jsonb, true, NULL, 413, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '同意事項', 'オンライン資格確認による診療情報の取得', 'radio', '["同意する","同意しない"]'::jsonb, true, NULL, 501, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '同意事項', 'オンライン資格確認による診療情報の取得', 'radio', '["同意する","同意しない"]'::jsonb, true, NULL, 501, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '同意事項', '口腔内写真の匿名利用（学会・SNS等）', 'radio', '["同意する","同意しない"]'::jsonb, true, NULL, 502, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000001', '同意事項', '口腔内写真の匿名利用（学会・SNS等）', 'radio', '["同意する","同意しない"]'::jsonb, true, NULL, 502, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000002', '基本情報', 'お名前', 'text', NULL, true, NULL, 1, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000002', '基本情報', 'フリガナ', 'text', NULL, true, NULL, 2, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000002', '基本情報', '生年月日', 'date', NULL, true, NULL, 3, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000002', '基本情報', '性別', 'radio', '["男性","女性","その他"]'::jsonb, true, NULL, 4, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000002', '基本情報', '電話番号', 'tel', NULL, true, NULL, 5, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000002', '基本情報', 'メールアドレス', 'email', NULL, false, NULL, 6, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000002', '受診理由', 'ご来院の理由', 'textarea', NULL, true, NULL, 7, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000002', '健康状態', 'アレルギーの有無', 'radio', '["なし","あり"]'::jsonb, true, NULL, 8, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000002', '健康状態', '現在服用中のお薬', 'radio', '["なし","あり"]'::jsonb, true, NULL, 9, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '舌', '舌の先をまるめる', 'checkbox', '["上に丸める","下に丸める"]'::jsonb, false, NULL, 1, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '舌', 'かむ', 'checkbox', '["該当する"]'::jsonb, false, NULL, 2, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '舌', 'もてあそぶ', 'checkbox', '["右にひねる","左にひねる"]'::jsonb, false, NULL, 3, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '舌', '舌で前歯を', 'checkbox', '["押す","触る"]'::jsonb, false, NULL, 4, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '舌', '舌を出す', 'checkbox', '["昼間","睡眠中","しゃべるとき","食べるとき"]'::jsonb, false, NULL, 5, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '口唇', '吸う', 'checkbox', '["該当する"]'::jsonb, false, NULL, 6, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '口唇', 'かむ', 'checkbox', '["上唇","下唇"]'::jsonb, false, NULL, 7, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '口唇', '前方へ突き出す', 'checkbox', '["該当する"]'::jsonb, false, NULL, 8, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '口唇', '内側にまき込む', 'checkbox', '["上唇","下唇","両方の唇"]'::jsonb, false, NULL, 9, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '口唇', 'なめる', 'checkbox', '["上","下"]'::jsonb, false, NULL, 10, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '口唇', '日中開いていることが多い', 'checkbox', '["大きく","小さく"]'::jsonb, false, NULL, 11, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '口唇', 'すぼめる', 'checkbox', '["該当する"]'::jsonb, false, NULL, 12, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', '指しゃぶり（歳～歳頃）', 'text', NULL, false, NULL, 13, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', 'おしゃぶり（歳～歳頃）', 'text', NULL, false, NULL, 14, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', '爪かみ', 'text', NULL, false, NULL, 15, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', 'エンピツをかむ（歳～歳頃）', 'text', NULL, false, NULL, 16, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', 'タオルを', 'text', NULL, false, NULL, 17, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', '哺乳瓶長期使用（歳 ヵ月頃まで）', 'text', NULL, false, NULL, 18, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', '歯ぎしり（歳～歳頃）', 'text', NULL, false, NULL, 19, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', '異常嚥下癖', 'checkbox', '["該当する"]'::jsonb, false, NULL, 20, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', '頬づえ', 'checkbox', '["該当する"]'::jsonb, false, NULL, 21, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他の癖', '母乳が長いと思う（歳 ヵ月頃まで）', 'text', NULL, false, NULL, 22, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '口が開いている', 'checkbox', '["該当する"]'::jsonb, false, NULL, 23, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '舌が出ている', 'checkbox', '["該当する"]'::jsonb, false, NULL, 24, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '口唇をかんで寝ている', 'checkbox', '["上唇","下唇"]'::jsonb, false, NULL, 25, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '上を向いて寝る', 'checkbox', '["該当する"]'::jsonb, false, NULL, 26, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '顔を横に向けて寝ることが多い', 'checkbox', '["左を向く","右を向く"]'::jsonb, false, NULL, 27, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '布団をかぶって寝る', 'checkbox', '["該当する"]'::jsonb, false, NULL, 28, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '布団が固いと眠れない', 'checkbox', '["該当する"]'::jsonb, false, NULL, 29, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '横を向いて丸くなって寝る', 'checkbox', '["右側を下にして眠る","左側を下にして眠る"]'::jsonb, false, NULL, 30, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', 'うつぶせで寝る事が多い', 'checkbox', '["右側を下にして眠る","左側を下にして眠る"]'::jsonb, false, NULL, 31, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '枕がないと眠れない', 'checkbox', '["高い枕","普通","低い","手枕"]'::jsonb, false, NULL, 32, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '枕の位置は？', 'checkbox', '["頭","首","ほっぺた","下顎"]'::jsonb, false, NULL, 33, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', '夜はベッドで寝ている', 'checkbox', '["該当する"]'::jsonb, false, NULL, 34, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '睡眠中', 'いびきがある', 'checkbox', '["該当する"]'::jsonb, false, NULL, 35, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '3度の食事をきちんと食べる', 'checkbox', '["該当する"]'::jsonb, false, NULL, 101, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '食が細い', 'checkbox', '["間食が多くておなかがすかない","カラダをあまり動かさないためおなかがすかない","好き嫌いが多い"]'::jsonb, false, NULL, 102, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', 'お煎餅やりんごなどを小さくかんで食べる', 'checkbox', '["該当する"]'::jsonb, false, NULL, 103, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '食べ物を小さく切る', 'checkbox', '["母","自分","その他"]'::jsonb, false, NULL, 104, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '奥歯であまりかまない', 'checkbox', '["該当する"]'::jsonb, false, NULL, 105, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '前歯をあまり使わない', 'checkbox', '["該当する"]'::jsonb, false, NULL, 106, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', 'お茶漬けなどの汁物が多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 107, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '食事中に水分を取ることが多い', 'checkbox', '["味噌汁","牛乳","お茶","水","その他"]'::jsonb, false, NULL, 108, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '口の中に入れる量はどれぐらい？', 'checkbox', '["多いと思う","適当だと思う","少ないと思う"]'::jsonb, false, NULL, 109, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '食べ物がいつまでも口の中に残っている', 'checkbox', '["該当する"]'::jsonb, false, NULL, 110, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '食事中クチャクチャ音がする', 'checkbox', '["該当する"]'::jsonb, false, NULL, 111, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', 'かんでる時には口も一緒に開いているようだ', 'checkbox', '["該当する"]'::jsonb, false, NULL, 112, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', 'かむ回数が少ないと思う', 'checkbox', '["該当する"]'::jsonb, false, NULL, 113, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '一度でなかなか飲み込めない', 'checkbox', '["口から出してしまう","２、３回に分けて飲み込んでいるようだ"]'::jsonb, false, NULL, 114, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '食事中の姿勢は悪いと思う', 'checkbox', '["すわりかたが悪い","食器の持ち方が悪い","かむときの姿勢"]'::jsonb, false, NULL, 115, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', 'テレビを見ながら食べている', 'checkbox', '["テレビは正面にある","右横","左横","目線より上","目線より下"]'::jsonb, false, NULL, 116, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '舌が食べ物を迎えにいく', 'checkbox', '["首を前に突き出して食べている","カラダを起こしているが口に食べ物を入れるとき舌が先に出てくる"]'::jsonb, false, NULL, 117, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '野菜をあまり食べない', 'checkbox', '["生野菜","煮野菜","どちらも食べない"]'::jsonb, false, NULL, 118, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', 'おやつが多い', 'checkbox', '["主に飲み物","主にスナック菓子","その他"]'::jsonb, false, NULL, 119, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '柔らか食事が多いと思う', 'checkbox', '["あまり固い物は食べない","筋があり繊維が強い物は食べない"]'::jsonb, false, NULL, 120, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '濃い味付けを好む', 'checkbox', '["母の味付けが濃い","自分で醤油やケチャップなどの調味料をかけて味を濃くする"]'::jsonb, false, NULL, 121, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '薬がうまく飲み込めない', 'checkbox', '["粉薬","錠剤","両方"]'::jsonb, false, NULL, 122, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '食べ物のかすが口唇の両端にたまる', 'checkbox', '["該当する"]'::jsonb, false, NULL, 123, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '食べながらよくこぼす', 'checkbox', '["該当する"]'::jsonb, false, NULL, 124, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '麺類をかむように食べる（つるつる一気に吸い上げれない）', 'checkbox', '["該当する"]'::jsonb, false, NULL, 125, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '食器を置いたまま食べる', 'checkbox', '["該当する"]'::jsonb, false, NULL, 126, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '飲み物が多い', 'checkbox', '["食事中","普段","水","お茶","甘い飲み物","その他"]'::jsonb, false, NULL, 127, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '朝食はパンが多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 128, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '朝の食事は早く食べなさいとせかされることが多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 129, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '食生活', '噛み方がおかしい', 'checkbox', '["右側だけでかんでいる","左側だけでかんでいる","前のほうで噛んでいる事が多い"]'::jsonb, false, NULL, 130, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '自分で姿勢が悪いと思う', 'checkbox', '["家","学校","幼稚園","保育園","食事中","テレビ","ゲーム","勉強中","本を読んでいるとき","寝ているとき","走っているとき"]'::jsonb, false, NULL, 201, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '最近、目が悪くなってきた', 'checkbox', '["右目","左目"]'::jsonb, false, NULL, 202, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '休日や暇な時は、家でゴロゴロしている', 'checkbox', '["該当する"]'::jsonb, false, NULL, 203, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '頬づえをよくつく', 'checkbox', '["右から","左から"]'::jsonb, false, NULL, 204, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '学校から帰るとぐったりするか、ゴロゴロする', 'checkbox', '["該当する"]'::jsonb, false, NULL, 205, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '壁の側では、壁に寄りかかってしまう', 'checkbox', '["右側","左側","後ろ"]'::jsonb, false, NULL, 206, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', 'イスに座っている時に、寄りかかることが多い', 'checkbox', '["右側","左側","後ろ"]'::jsonb, false, NULL, 207, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '座ったときは脱力していることが多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 208, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', 'イスに座ると足を組んでしまうことが多い', 'checkbox', '["右足を左足の上に乗せる","左足を右足の上に乗せる","両方"]'::jsonb, false, NULL, 209, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '横座りをしている', 'checkbox', '["右足を横に出す","左足を横に出す"]'::jsonb, false, NULL, 210, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '両足の間にお尻を落として座っている', 'checkbox', '["該当する"]'::jsonb, false, NULL, 211, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '自宅でソファーに座ることが多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 212, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '歩く時は、がに股になってしまう', 'checkbox', '["該当する"]'::jsonb, false, NULL, 213, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '歩く時は 内股歩きになってしまう', 'checkbox', '["該当する"]'::jsonb, false, NULL, 214, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '歩く時は、外股歩きになってしまう', 'checkbox', '["該当する"]'::jsonb, false, NULL, 215, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '靴が変な減り方をする', 'checkbox', '["外側が磨り減る","内側が磨り減る","つま先が磨り減る","かかとが磨り減る","右側だけ磨り減る","左側だけ磨り減る"]'::jsonb, false, NULL, 216, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '身体が弱いので何か、スポーツをやりたいと思っている', 'checkbox', '["該当する"]'::jsonb, false, NULL, 217, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '健康のためスポーツ施設に通っている', 'text', NULL, false, NULL, 218, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '部活をやっている', 'text', NULL, false, NULL, 219, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '歯ぎしりがひどい', 'checkbox', '["該当する"]'::jsonb, false, NULL, 220, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '普段自転車に乗ることが多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 221, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '歩くとき下向きの姿勢が多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 222, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '床に寝そべって絵や字を書く事が多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 223, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '寝ながら本を読む事が多い', 'checkbox', '["上を向く","うつぶせになり下を向く","右を向く","左を向く"]'::jsonb, false, NULL, 224, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', 'パソコンやテレビゲームをよくする', 'checkbox', '["該当する"]'::jsonb, false, NULL, 225, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '食事をする時、つい口の方を食べ物に近づけてしまう', 'checkbox', '["首を前に突き出す","体が前に倒れる","両方の動作をする"]'::jsonb, false, NULL, 226, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '下向きに歩いている事が多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 227, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', 'テレビを横向きになって見ている事が多い', 'checkbox', '["右側にテレビがある","正面","左側にテレビがある","上向き","下向き"]'::jsonb, false, NULL, 228, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '食事の時ひじを着いてしまう', 'checkbox', '["右ひじ","左ひじ"]'::jsonb, false, NULL, 229, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '食事中の姿勢が悪い', 'checkbox', '["カラダを倒す","カラダをひねる","首を曲げる","足を出す"]'::jsonb, false, NULL, 230, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '寝相が悪い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 231, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '整体に行ったことがある', 'checkbox', '["該当する"]'::jsonb, false, NULL, 232, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '身体が曲がっていると言われた', 'checkbox', '["該当する"]'::jsonb, false, NULL, 233, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', 'ショルダーバッグをかけにくい', 'checkbox', '["右側がかけにくい","左側がかけにくい"]'::jsonb, false, NULL, 234, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '顔が傾いている事が多い', 'checkbox', '["右に傾く","左に傾く"]'::jsonb, false, NULL, 235, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '新聞や本を床に置いて読む事が多い', 'checkbox', '["該当する"]'::jsonb, false, NULL, 236, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '猫背だと思う', 'checkbox', '["該当する"]'::jsonb, false, NULL, 237, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', 'いつも肩がこっている', 'checkbox', '["左","右"]'::jsonb, false, NULL, 238, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '走る時身体が前に倒れ過ぎていると思う', 'checkbox', '["該当する"]'::jsonb, false, NULL, 239, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', 'よく便秘する', 'checkbox', '["該当する"]'::jsonb, false, NULL, 240, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '喘息だと言われた事がある', 'checkbox', '["該当する"]'::jsonb, false, NULL, 241, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '御飯が食べられないほど疲れる', 'checkbox', '["該当する"]'::jsonb, false, NULL, 242, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '腰痛を経験した事がある', 'checkbox', '["右側が痛かった","左側が痛かった","腰の後ろ側が痛かった"]'::jsonb, false, NULL, 243, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', 'いつもアゴがあがっている', 'checkbox', '["該当する"]'::jsonb, false, NULL, 244, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', 'テーブル、机に向かうとすぐひじをつく', 'checkbox', '["右側をつく","左側をつく","両方ひじをつき前によりかかってしまう"]'::jsonb, false, NULL, 245, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '姿勢', '寝そべってテレビを見ている', 'checkbox', '["うつぶせ","仰向け","横になって"]'::jsonb, false, NULL, 246, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '鼻に関するもの', '花粉症', 'checkbox', '["該当する"]'::jsonb, false, NULL, 301, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '鼻に関するもの', '蓄膿症', 'checkbox', '["該当する"]'::jsonb, false, NULL, 302, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '鼻に関するもの', '鼻中隔湾曲症', 'checkbox', '["該当する"]'::jsonb, false, NULL, 303, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '鼻に関するもの', 'アレルギー性鼻炎', 'checkbox', '["該当する"]'::jsonb, false, NULL, 304, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '鼻に関するもの', '鼻血をよく出す', 'checkbox', '["該当する"]'::jsonb, false, NULL, 305, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '鼻に関するもの', '鼻をクンクン鳴らす', 'checkbox', '["該当する"]'::jsonb, false, NULL, 306, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '鼻に関するもの', '鼻かみがへただ', 'checkbox', '["該当する"]'::jsonb, false, NULL, 307, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '鼻に関するもの', 'その他（鼻）', 'checkbox', '["該当する"]'::jsonb, false, NULL, 308, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '耳に関するもの', '急性中耳炎', 'checkbox', '["該当する"]'::jsonb, false, NULL, 401, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '耳に関するもの', '滲出性中耳炎', 'checkbox', '["該当する"]'::jsonb, false, NULL, 402, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '耳に関するもの', 'その他（耳）', 'checkbox', '["該当する"]'::jsonb, false, NULL, 403, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '喉に関するもの', '扁桃腺肥大', 'checkbox', '["該当する"]'::jsonb, false, NULL, 501, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '喉に関するもの', 'アデノイド肥大', 'checkbox', '["該当する"]'::jsonb, false, NULL, 502, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '喉に関するもの', '喘息気管支炎', 'checkbox', '["該当する"]'::jsonb, false, NULL, 503, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '喉に関するもの', 'タンがからむ', 'checkbox', '["該当する"]'::jsonb, false, NULL, 504, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '喉に関するもの', '風邪をひくとよく熱を出す', 'checkbox', '["該当する"]'::jsonb, false, NULL, 505, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', '喉に関するもの', 'その他（喉）', 'checkbox', '["該当する"]'::jsonb, false, NULL, 506, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他', '股関節脱臼', 'checkbox', '["該当する"]'::jsonb, false, NULL, 601, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他', '骨形成不全', 'checkbox', '["該当する"]'::jsonb, false, NULL, 602, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他', '骨折', 'checkbox', '["該当する"]'::jsonb, false, NULL, 603, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他', '顎関節症', 'checkbox', '["該当する"]'::jsonb, false, NULL, 604, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他', 'アキレス腱切断', 'checkbox', '["該当する"]'::jsonb, false, NULL, 605, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他', '自家中毒', 'checkbox', '["該当する"]'::jsonb, false, NULL, 606, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他', 'チック症', 'checkbox', '["該当する"]'::jsonb, false, NULL, 607, NULL, NULL);
INSERT INTO system_questionnaire_template_questions (template_id, section_name, question_text, question_type, options, is_required, conditional_logic, sort_order, linked_field, placeholder) VALUES ('00000000-0000-0000-0004-000000000003', 'その他', 'その他の病気', 'checkbox', '["該当する"]'::jsonb, false, NULL, 608, NULL, NULL);
