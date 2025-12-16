import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 リッチメニューID設定を確認\n');

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

// LINE基本設定を確認
const { data: lineSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

console.log('📋 LINE基本設定 (line キー):');
if (lineSettings?.setting_value) {
  const line = lineSettings.setting_value;
  console.log(`   ✅ Channel Access Token: ${line.channel_access_token?.substring(0, 20)}...`);
  console.log(`   ✅ Channel Secret: ****`);
  console.log(`   ✅ Channel ID: ${line.channel_id || '未設定'}`);
  console.log(`   ✅ Webhook URL: ${line.webhook_url || '未設定'}`);
} else {
  console.log('   ❌ LINE基本設定が見つかりません');
}

console.log('');

// リッチメニューID設定を確認
const { data: richMenuSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

console.log('📋 リッチメニューID設定 (line_rich_menu キー):');
if (richMenuSettings?.setting_value) {
  const richMenu = richMenuSettings.setting_value;
  console.log(`   連携済みメニューID: ${richMenu.line_registered_rich_menu_id || '❌ 未設定'}`);
  console.log(`   未連携メニューID: ${richMenu.line_unregistered_rich_menu_id || '❌ 未設定'}`);

  if (richMenu.line_registered_rich_menu_id && richMenu.line_unregistered_rich_menu_id) {
    console.log('\n✅ 両方のリッチメニューIDが設定されています！');
  } else {
    console.log('\n⚠️  片方のリッチメニューIDが未設定です');
  }
} else {
  console.log('   ❌ リッチメニューID設定が見つかりません');
  console.log('\n💡 設定ページでリッチメニューを登録してください');
}

console.log('\n' + '='.repeat(60));

// 患者連携履歴を確認
const { data: linkages } = await supabase
  .from('line_patient_linkages')
  .select('id, line_user_id, patient_id, created_at')
  .eq('clinic_id', clinicId)
  .order('created_at', { ascending: false })
  .limit(5);

console.log('\n📋 最近の患者連携履歴:');
if (linkages && linkages.length > 0) {
  console.log(`   ✅ ${linkages.length}件の連携が見つかりました`);
  linkages.forEach((linkage, i) => {
    console.log(`\n   ${i + 1}. LINE User ID: ${linkage.line_user_id}`);
    console.log(`      患者ID: ${linkage.patient_id}`);
    console.log(`      連携日時: ${new Date(linkage.created_at).toLocaleString('ja-JP')}`);
  });
} else {
  console.log('   ❌ 連携履歴が見つかりません');
  console.log('   💡 LINEアプリで患者連携を実行してください');
}

console.log('\n' + '='.repeat(60));
