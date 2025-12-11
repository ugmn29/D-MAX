import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📋 LINE設定を確認中...\n');

// clinic_idを取得
const { data: clinics, error: clinicsError } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

if (clinicsError || !clinics || clinics.length === 0) {
  console.error('❌ クリニック情報が見つかりません');
  process.exit(1);
}

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name} (${clinicId})\n`);

// 全ての clinic_settings を確認
const { data: allSettings, error: allError } = await supabase
  .from('clinic_settings')
  .select('*')
  .eq('clinic_id', clinicId);

if (allError) {
  console.error('❌ エラー:', allError);
  process.exit(1);
}

console.log('📊 現在の設定キー一覧:');
allSettings.forEach(s => {
  console.log(`  - ${s.setting_key}`);
});

console.log('\n🔍 LINE関連の設定を検索:\n');

// notificationConnection を確認
const notifConn = allSettings.find(s => s.setting_key === 'notificationConnection');
if (notifConn) {
  console.log('✅ notificationConnection 設定が見つかりました:');
  console.log(JSON.stringify(notifConn.setting_value, null, 2));
} else {
  console.log('❌ notificationConnection 設定なし');
}

console.log('\n');

// line を確認
const lineSetting = allSettings.find(s => s.setting_key === 'line');
if (lineSetting) {
  console.log('✅ line 設定が見つかりました:');
  console.log(JSON.stringify(lineSetting.setting_value, null, 2));
} else {
  console.log('❌ line 設定なし');
}

console.log('\n');

// line_rich_menu を確認
const richMenuSetting = allSettings.find(s => s.setting_key === 'line_rich_menu');
if (richMenuSetting) {
  console.log('✅ line_rich_menu 設定が見つかりました:');
  console.log(JSON.stringify(richMenuSetting.setting_value, null, 2));
} else {
  console.log('❌ line_rich_menu 設定なし');
}
