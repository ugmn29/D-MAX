import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 本番環境のLINE設定を確認\n');

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

// LINE基本設定
const { data: lineSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

console.log('【LINE基本設定】');
if (lineSettings?.setting_value) {
  const token = lineSettings.setting_value.channel_access_token;
  const isTestToken = token && token.startsWith('test-');
  console.log(`   Access Token: ${token?.substring(0, 30)}...`);
  console.log(`   ${isTestToken ? '❌ テストトークン' : '✅ 本番トークン'}`);
} else {
  console.log('   ❌ 未設定');
}
console.log('');

// リッチメニューID設定
const { data: richMenuSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

console.log('【リッチメニューID設定】');
if (richMenuSettings?.setting_value) {
  const registered = richMenuSettings.setting_value.line_registered_rich_menu_id;
  const unregistered = richMenuSettings.setting_value.line_unregistered_rich_menu_id;
  console.log(`   連携済み: ${registered ? '✅ ' + registered : '❌ 未設定'}`);
  console.log(`   未連携: ${unregistered ? '✅ ' + unregistered : '❌ 未設定'}`);
} else {
  console.log('   ❌ 未設定');
}
console.log('');

// 最新の患者連携履歴
const { data: linkages } = await supabase
  .from('line_patient_linkages')
  .select('id, line_user_id, patient_id, created_at')
  .eq('clinic_id', clinicId)
  .order('created_at', { ascending: false })
  .limit(3);

console.log('【最新の患者連携履歴】');
if (linkages && linkages.length > 0) {
  linkages.forEach((link, i) => {
    console.log(`   ${i + 1}. ${new Date(link.created_at).toLocaleString('ja-JP')}`);
    console.log(`      LINE User ID: ${link.line_user_id}`);
    console.log(`      Patient ID: ${link.patient_id}`);
  });
} else {
  console.log('   ❌ 連携履歴なし');
}
console.log('');

console.log('='.repeat(60));
console.log('【結論】\n');

const hasToken = lineSettings?.setting_value?.channel_access_token;
const isTestToken = hasToken && hasToken.startsWith('test-');
const hasMenuIds = richMenuSettings?.setting_value?.line_registered_rich_menu_id &&
                   richMenuSettings?.setting_value?.line_unregistered_rich_menu_id;

if (isTestToken) {
  console.log('❌ テストトークンでは動作しません');
  console.log('   → 本番のChannel Access Tokenを設定してください');
  console.log('   → 設定ページ: https://shikabot-mu.vercel.app/settings');
  console.log('   → 通知タブ > 接続設定 > LINEの設定を更新');
} else if (!hasToken) {
  console.log('❌ Channel Access Tokenが未設定です');
} else if (!hasMenuIds) {
  console.log('❌ リッチメニューIDが未設定です');
  console.log('   → 「既存メニューを自動読み込み」ボタンをクリック');
} else {
  console.log('✅ すべての設定が完了しています！');
  console.log('   患者連携時にリッチメニューが自動切り替えされるはずです。');
}
