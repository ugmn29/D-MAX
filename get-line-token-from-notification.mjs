import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://obdfmwpdkwraqqqyjgwu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDk3NTkzMCwiZXhwIjoyMDQ2NTUxOTMwfQ.AuBYte-x23H2dKxZC7qK6aZxmJpTsvVXAo3hYsWTW5Y';

const supabase = createClient(PROD_URL, SERVICE_ROLE_KEY);

console.log('🔍 通知設定からLINE情報を取得\n');

// 通知設定を取得
const { data: notificationSettings, error } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', '11111111-1111-1111-1111-111111111111')
  .eq('setting_key', 'notification')
  .maybeSingle();

if (error || !notificationSettings) {
  console.error('❌ 通知設定が見つかりません');
  console.error(error);
  process.exit(1);
}

console.log('通知設定:');
console.log(JSON.stringify(notificationSettings.setting_value, null, 2));

// LINE設定を抽出
const lineConfig = notificationSettings.setting_value?.line;

if (!lineConfig) {
  console.error('\n❌ LINE設定が見つかりません');
  process.exit(1);
}

console.log('\n✅ LINE設定を取得しました:');
console.log('Channel ID:', lineConfig.channel_id);
console.log('Channel Secret:', lineConfig.channel_secret ? '設定済み' : '未設定');
console.log('Channel Access Token:', lineConfig.channel_access_token ? '設定済み' : '未設定');

// データベースのline設定キーに保存
console.log('\n📝 データベースに保存中...');

const { error: upsertError } = await supabase
  .from('clinic_settings')
  .upsert({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    setting_key: 'line',
    setting_value: {
      channel_id: lineConfig.channel_id,
      channel_secret: lineConfig.channel_secret,
      channel_access_token: lineConfig.channel_access_token
    }
  });

if (upsertError) {
  console.error('❌ 保存エラー:', upsertError);
  process.exit(1);
}

console.log('✅ LINE設定をデータベースに保存しました');
