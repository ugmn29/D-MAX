-- Web予約を有効化するSQL

-- clinic_settingsテーブルにweb_reservation設定を挿入または更新
INSERT INTO clinic_settings (clinic_id, setting_key, setting_value, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'web_reservation',
  '{"isEnabled": true, "reservationPeriod": 30, "allowCurrentTime": true, "openAllSlots": false, "allowStaffSelection": true, "webPageUrl": "", "showCancelPolicy": true, "cancelPolicyText": "キャンセルポリシーのデフォルトテキスト", "patientInfoFields": {"phoneRequired": true, "phoneEnabled": true, "emailRequired": false, "emailEnabled": true}, "flow": {"initialSelection": true, "menuSelection": true, "calendarDisplay": true, "patientInfo": true, "confirmation": true}, "booking_menus": []}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (clinic_id, setting_key)
DO UPDATE SET
  setting_value = jsonb_set(
    clinic_settings.setting_value,
    '{isEnabled}',
    'true'::jsonb
  ),
  updated_at = NOW();

-- 確認用クエリ
SELECT setting_key, setting_value->>'isEnabled' as is_enabled
FROM clinic_settings
WHERE clinic_id = '11111111-1111-1111-1111-111111111111'
  AND setting_key = 'web_reservation';
