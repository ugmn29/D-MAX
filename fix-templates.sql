-- notification_templatesテーブルを削除して再作成
DROP TABLE IF EXISTS notification_templates CASCADE;

-- 1. 通知テンプレートテーブル
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,

  name VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('periodic_checkup', 'treatment_reminder', 'appointment_reminder', 'appointment_change', 'custom')),
  message_template TEXT NOT NULL,

  -- 多チャネル対応フィールド
  line_message TEXT,
  email_subject VARCHAR(255),
  email_message TEXT,
  sms_message VARCHAR(160),

  default_timing_value INTEGER,
  default_timing_unit VARCHAR(20) CHECK (default_timing_unit IN ('days', 'weeks', 'months')),
  default_web_booking_menu_ids UUID[],
  default_staff_id UUID,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_clinic_id ON notification_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type);

-- デフォルトテンプレートを挿入
INSERT INTO notification_templates (
  clinic_id,
  name,
  notification_type,
  message_template,
  line_message,
  email_subject,
  email_message,
  sms_message
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '予約確定通知',
  'appointment_reminder',
  '{{patient_name}}様、ご予約ありがとうございます。',
  E'{{patient_name}}様\n\nご予約ありがとうございます。\n\n■ご予約内容\n日時：{{appointment_datetime}}\n治療内容：{{treatment_name}}\n担当医：{{staff_name}}\n\nご来院をお待ちしております。\n\n【キャンセル・変更について】\nやむを得ずキャンセルされる場合は、お早めにご連絡ください。\nLINEのリッチメニュー「予約確認」からも変更可能です。\n\n{{clinic_name}}',
  '【{{clinic_name}}】ご予約確定のお知らせ',
  E'{{patient_name}}様\n\nいつもありがとうございます。\n{{clinic_name}}です。\n\nご予約を承りました。\n\n■ご予約内容\n日時：{{appointment_datetime}}\n治療内容：{{treatment_name}}\n担当医：{{staff_name}}\n\n■ご来院時のお願い\n・保険証をお持ちください\n・歯磨きをしてご来院いただけると幸いです\n\nご来院をお待ちしております。\n\n{{clinic_name}}',
  '{{patient_name}}様 {{appointment_date}}{{appointment_time}}のご予約を承りました。{{clinic_name}}'
),
(
  '11111111-1111-1111-1111-111111111111',
  '予約3日前リマインド',
  'appointment_reminder',
  '{{patient_name}}様、{{appointment_date}}のご予約のリマインドです。',
  E'{{patient_name}}様\n\n{{clinic_name}}です。\n{{appointment_date}}のご予約のリマインドです。\n\n■ご予約内容\n日時：{{appointment_datetime}}\n治療内容：{{treatment_name}}\n担当医：{{staff_name}}\n\n【ご来院前のお願い】\n・歯磨きをしてご来院ください\n・保険証をお持ちください\n\nキャンセルされる場合は、お早めにご連絡ください。\n\n{{clinic_name}}',
  '【{{clinic_name}}】ご予約のリマインド（3日前）',
  E'{{patient_name}}様\n\n{{clinic_name}}です。\n{{appointment_date}}のご予約のリマインドです。\n\n■ご予約内容\n日時：{{appointment_datetime}}\n治療内容：{{treatment_name}}\n担当医：{{staff_name}}\n\n■ご来院前のお願い\n・保険証をお持ちください\n・歯磨きをしてご来院いただけると幸いです\n\nキャンセルされる場合は、お早めにご連絡ください。\n\nご来院をお待ちしております。\n\n{{clinic_name}}',
  '{{patient_name}}様 {{appointment_date}}{{appointment_time}}のご予約です。{{clinic_name}}'
),
(
  '11111111-1111-1111-1111-111111111111',
  '予約前日リマインド',
  'appointment_reminder',
  '{{patient_name}}様、明日のご予約のお知らせです。',
  E'{{patient_name}}様\n\n{{clinic_name}}です。\n明日のご予約のお知らせです。\n\n■ご予約内容\n日時：{{appointment_datetime}}\n治療内容：{{treatment_name}}\n担当医：{{staff_name}}\n\nお待ちしております。\n\n{{clinic_name}}',
  '【{{clinic_name}}】明日のご予約について',
  E'{{patient_name}}様\n\n{{clinic_name}}です。\n明日のご予約のお知らせです。\n\n■ご予約内容\n日時：{{appointment_datetime}}\n治療内容：{{treatment_name}}\n担当医：{{staff_name}}\n\nご来院をお待ちしております。\n\n{{clinic_name}}',
  '{{patient_name}}様 明日{{appointment_time}}のご予約です。{{clinic_name}}'
),
(
  '11111111-1111-1111-1111-111111111111',
  '定期検診3ヶ月後リマインド',
  'periodic_checkup',
  '{{patient_name}}様、定期検診のご案内です。',
  E'{{patient_name}}様\n\n{{clinic_name}}です。\n前回のご来院から3ヶ月が経過しました。\n\nお口の健康を保つため、3〜6ヶ月ごとの定期検診をお勧めしております。\n\n■定期検診の内容\n・虫歯チェック\n・歯石除去（クリーニング）\n・歯周病チェック\n・ブラッシング指導\n\nご予約はリッチメニューの「予約確認」から、または下記URLからお願いいたします。\n\n{{booking_url}}\n\n{{clinic_name}}',
  '【{{clinic_name}}】定期検診のご案内',
  E'{{patient_name}}様\n\nいつもありがとうございます。\n{{clinic_name}}です。\n\n前回のご来院から3ヶ月が経過しました。\n\nお口の健康を保つため、定期的な検診をお勧めしております。\n\n■定期検診の重要性\n虫歯や歯周病は、初期段階では自覚症状がほとんどありません。\n定期検診により早期発見・早期治療が可能となり、歯の寿命を延ばすことができます。\n\n■定期検診の内容\n・虫歯チェック\n・歯石除去（クリーニング）\n・歯周病チェック\n・ブラッシング指導\n・フッ素塗布（希望者）\n\n所要時間：30分〜45分程度\n\nご予約は下記URLまたはお電話でお願いいたします。\n{{booking_url}}\n\n{{clinic_name}}',
  '{{patient_name}}様 定期検診のご案内です。ご予約お待ちしております。{{clinic_name}}'
),
(
  '11111111-1111-1111-1111-111111111111',
  'LINE連携完了通知',
  'custom',
  '{{patient_name}}様、LINE連携が完了しました。',
  E'{{patient_name}}様\n\n{{clinic_name}}のLINE公式アカウントへようこそ！\n連携が完了しました。\n\n■LINEで利用できる機能\n📱 診察券（QRコード）\n　受付でQRコードを表示するだけでOK\n\n📅 予約の確認・変更\n　24時間いつでも予約確認・変更が可能\n\n👨‍👩‍👧‍👦 家族の登録\n　ご家族の予約も一緒に管理できます\n\n💬 お問い合わせ\n　診療時間や治療内容などお気軽にご質問ください\n\n下のリッチメニューからご利用いただけます。\n今後ともよろしくお願いいたします。\n\n{{clinic_name}}',
  NULL,
  NULL,
  NULL
);
