import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📋 通知設定を確認中...\n');

// clinic_idを取得
const { data: clinics } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

if (!clinics || clinics.length === 0) {
  console.error('❌ クリニック情報が見つかりません');
  process.exit(1);
}

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name} (${clinicId})\n`);

// notification関連の設定を全て取得
const { data: notificationSettings, error } = await supabase
  .from('clinic_settings')
  .select('*')
  .eq('clinic_id', clinicId)
  .or('setting_key.ilike.%notification%,setting_key.ilike.%line%');

if (error) {
  console.error('❌ エラー:', error);
  process.exit(1);
}

if (!notificationSettings || notificationSettings.length === 0) {
  console.log('❌ 通知関連の設定が見つかりません\n');

  // 全ての設定キーを表示
  const { data: allSettings } = await supabase
    .from('clinic_settings')
    .select('setting_key')
    .eq('clinic_id', clinicId);

  console.log('📊 現在保存されている全ての設定キー:');
  allSettings?.forEach(s => console.log(`  - ${s.setting_key}`));

  process.exit(0);
}

console.log(`✅ ${notificationSettings.length}件の通知関連設定が見つかりました:\n`);

notificationSettings.forEach(setting => {
  console.log(`📌 ${setting.setting_key}:`);
  console.log(JSON.stringify(setting.setting_value, null, 2));
  console.log('');
});

// notificationConnection を詳しく確認
const notifConn = notificationSettings.find(s => s.setting_key === 'notificationConnection');
if (notifConn && notifConn.setting_value?.line) {
  console.log('🔍 LINE設定の詳細:');
  const line = notifConn.setting_value.line;
  console.log(`  enabled: ${line.enabled}`);
  console.log(`  channelId: ${line.channelId || '未設定'}`);
  console.log(`  channelSecret: ${line.channelSecret ? '設定済み (****)' : '未設定'}`);
  console.log(`  accessToken: ${line.accessToken ? `設定済み (${line.accessToken.substring(0, 20)}...)` : '未設定'}`);
  console.log(`  webhookUrl: ${line.webhookUrl || '未設定'}`);
}
