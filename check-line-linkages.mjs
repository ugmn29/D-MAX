import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 LINE連携状況を確認\n');

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

// 患者連携を確認
const { data: linkages, error: linkagesError } = await supabase
  .from('line_patient_linkages')
  .select('id, line_user_id, patient_id, created_at')
  .eq('clinic_id', clinicId)
  .order('created_at', { ascending: false });

if (linkagesError) {
  console.error('❌ 連携情報取得エラー:', linkagesError);
  process.exit(1);
}

if (!linkages || linkages.length === 0) {
  console.log('❌ LINE連携が見つかりません');
  console.log('まず患者連携を行ってください。');
  process.exit(0);
}

console.log(`✅ ${linkages.length}件のLINE連携が見つかりました:\n`);

linkages.forEach((linkage, i) => {
  console.log(`${i + 1}. 患者ID: ${linkage.patient_id}`);
  console.log(`   LINE User ID: ${linkage.line_user_id}`);
  console.log(`   連携日時: ${new Date(linkage.created_at).toLocaleString('ja-JP')}`);
  console.log('');
});

// LINE設定を確認
console.log('📋 LINE基本設定を確認:\n');

const { data: lineSettings, error: lineError } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

if (lineError) {
  console.error('❌ LINE設定取得エラー:', lineError);
} else if (!lineSettings || !lineSettings.setting_value) {
  console.log('❌ LINE基本設定が未登録');
  console.log('   → リッチメニュー切り替えが動作しません');
} else {
  const line = lineSettings.setting_value;
  console.log('✅ LINE基本設定が存在します:');
  console.log(`   Channel Access Token: ${line.channel_access_token ? line.channel_access_token.substring(0, 20) + '...' : '未設定'}`);
  console.log(`   Channel Secret: ${line.channel_secret ? '****' : '未設定'}`);
  console.log(`   Channel ID: ${line.channel_id || '未設定'}`);
  console.log(`   Webhook URL: ${line.webhook_url || '未設定'}`);
}

console.log('');

// リッチメニュー設定を確認
console.log('📋 リッチメニュー設定を確認:\n');

const { data: richMenuSettings, error: richMenuError } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

if (richMenuError) {
  console.error('❌ リッチメニュー設定取得エラー:', richMenuError);
} else if (!richMenuSettings || !richMenuSettings.setting_value) {
  console.log('⚠️  リッチメニューID未設定');
  console.log('   → リッチメニューの内容は切り替わりません');
} else {
  const richMenu = richMenuSettings.setting_value;
  console.log('✅ リッチメニュー設定が存在します:');
  console.log(`   連携済みメニューID: ${richMenu.line_registered_rich_menu_id || '未設定'}`);
  console.log(`   未連携メニューID: ${richMenu.line_unregistered_rich_menu_id || '未設定'}`);
}

console.log('\n' + '='.repeat(60));
console.log('📊 診断結果\n');

const hasLineSettings = lineSettings?.setting_value?.channel_access_token && lineSettings?.setting_value?.channel_secret;
const hasRichMenuIds = richMenuSettings?.setting_value?.line_registered_rich_menu_id && richMenuSettings?.setting_value?.line_unregistered_rich_menu_id;

if (hasLineSettings && hasRichMenuIds) {
  console.log('✅ すべての設定が揃っています！');
  console.log('   リッチメニュー切り替えが正常に動作するはずです。');
  console.log('\n💡 それでも切り替わらない場合:');
  console.log('   1. 連携を一度解除して、再度連携を試す');
  console.log('   2. LINEアプリを完全に再起動');
  console.log('   3. Vercelログで「リッチメニュー切り替え」のログを確認');
} else {
  console.log('❌ 設定が不足しています:\n');

  if (!hasLineSettings) {
    console.log('【必須】LINE基本設定が未登録');
    console.log('   → 以下のコマンドで登録してください:');
    console.log('   source .env.local && node manual-insert-line-settings.mjs "<secret>" "<token>" "<id>"');
    console.log('');
  }

  if (!hasRichMenuIds) {
    console.log('【推奨】リッチメニューIDが未設定');
    console.log('   → LINE Developers Consoleでリッチメニューを作成後:');
    console.log('   source .env.local && node setup-line-rich-menu-ids.mjs "<registered_id>" "<unregistered_id>"');
  }
}

console.log('='.repeat(60));
