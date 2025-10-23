-- 通知テンプレートシステムテンプレートのデフォルトデータ挿入（5件）

-- 1. 予約確定通知
INSERT INTO system_notification_templates (
  id,
  name,
  notification_type,
  message_template,
  line_message,
  email_subject,
  email_message,
  sms_message,
  sort_order
) VALUES (
  '00000000-0000-0000-0003-000000000001',
  '予約確定通知',
  'appointment_reminder',
  '{{patient_name}}様、ご予約ありがとうございます。',
  '{{patient_name}}様

ご予約ありがとうございます。

■ご予約内容
日時：{{appointment_datetime}}
治療内容：{{treatment_name}}
担当医：{{staff_name}}

ご来院をお待ちしております。

【キャンセル・変更について】
やむを得ずキャンセルされる場合は、お早めにご連絡ください。
LINEのリッチメニュー「予約確認」からも変更可能です。

{{clinic_name}}',
  '【{{clinic_name}}】ご予約確定のお知らせ',
  '{{patient_name}}様

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
TEL: {{clinic_phone}}',
  '{{patient_name}}様 {{appointment_date}}{{appointment_time}}のご予約を承りました。{{clinic_name}}',
  1
);

-- 2. 予約リマインド
INSERT INTO system_notification_templates (
  id,
  name,
  notification_type,
  message_template,
  line_message,
  email_subject,
  email_message,
  sms_message,
  default_timing_value,
  default_timing_unit,
  sort_order
) VALUES (
  '00000000-0000-0000-0003-000000000002',
  '予約リマインド',
  'appointment_reminder',
  '{{patient_name}}様、{{appointment_date}}のご予約のリマインドです。',
  '{{patient_name}}様

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
TEL: {{clinic_phone}}',
  '【{{clinic_name}}】ご予約のリマインド',
  '{{patient_name}}様

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
TEL: {{clinic_phone}}',
  '{{patient_name}}様 {{appointment_date}}{{appointment_time}}のご予約です。{{clinic_name}}',
  1,
  'days',
  2
);

-- 3. 定期検診リマインド
INSERT INTO system_notification_templates (
  id,
  name,
  notification_type,
  message_template,
  line_message,
  email_subject,
  email_message,
  sms_message,
  default_timing_value,
  default_timing_unit,
  sort_order
) VALUES (
  '00000000-0000-0000-0003-000000000003',
  '定期検診リマインド',
  'periodic_checkup',
  '{{patient_name}}様、定期検診のご案内です。',
  '{{patient_name}}様

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
TEL: {{clinic_phone}}',
  '【{{clinic_name}}】定期検診のご案内',
  '{{patient_name}}様

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
TEL: {{clinic_phone}}',
  '{{patient_name}}様 定期検診のご案内です。ご予約お待ちしております。{{clinic_name}} {{clinic_phone}}',
  3,
  'months',
  3
);

-- 4. 治療リマインド
INSERT INTO system_notification_templates (
  id,
  name,
  notification_type,
  message_template,
  line_message,
  email_subject,
  email_message,
  sms_message,
  default_timing_value,
  default_timing_unit,
  sort_order
) VALUES (
  '00000000-0000-0000-0003-000000000004',
  '治療リマインド',
  'treatment_reminder',
  '{{patient_name}}様、治療のご案内です。',
  '{{patient_name}}様

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
TEL: {{clinic_phone}}',
  '【{{clinic_name}}】治療のご案内',
  '{{patient_name}}様

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
TEL: {{clinic_phone}}',
  '{{patient_name}}様 治療のご案内です。ご予約お待ちしております。{{clinic_name}} {{clinic_phone}}',
  1,
  'months',
  4
);

-- 5. LINE連携完了通知
INSERT INTO system_notification_templates (
  id,
  name,
  notification_type,
  message_template,
  line_message,
  email_subject,
  email_message,
  sms_message,
  sort_order
) VALUES (
  '00000000-0000-0000-0003-000000000005',
  'LINE連携完了通知',
  'custom',
  '{{patient_name}}様、LINE連携が完了しました。',
  '{{patient_name}}様

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

{{clinic_name}}',
  NULL,
  NULL,
  NULL,
  5
);
