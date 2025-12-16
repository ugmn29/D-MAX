import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 最新の患者連携を確認\n');

// clinic_idを取得
const { data: clinics } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name}\n`);

// 最新の患者連携（過去1時間）
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

const { data: linkages } = await supabase
  .from('line_patient_linkages')
  .select('id, line_user_id, patient_id, created_at')
  .eq('clinic_id', clinicId)
  .gte('created_at', oneHourAgo)
  .order('created_at', { ascending: false });

console.log('【過去1時間の患者連携】');
if (linkages && linkages.length > 0) {
  console.log(`   ${linkages.length}件の連携がありました\n`);

  linkages.forEach((link, i) => {
    const timeAgo = Math.floor((Date.now() - new Date(link.created_at).getTime()) / 60000);
    console.log(`   ${i + 1}. ${timeAgo}分前`);
    console.log(`      LINE User ID: ${link.line_user_id}`);
    console.log(`      Patient ID: ${link.patient_id}`);
    console.log(`      作成日時: ${new Date(link.created_at).toLocaleString('ja-JP')}`);
    console.log('');
  });

  // リッチメニューID設定を確認
  const { data: richMenuSettings } = await supabase
    .from('clinic_settings')
    .select('setting_value')
    .eq('clinic_id', clinicId)
    .eq('setting_key', 'line_rich_menu')
    .maybeSingle();

  console.log('【リッチメニューID設定】');
  if (richMenuSettings?.setting_value) {
    console.log(`   連携済み用: ${richMenuSettings.setting_value.line_registered_rich_menu_id || '❌ 未設定'}`);
    console.log(`   未連携用: ${richMenuSettings.setting_value.line_unregistered_rich_menu_id || '❌ 未設定'}`);
  } else {
    console.log('   ❌ 未設定');
  }
  console.log('');

  // LINE設定を確認
  const { data: lineSettings } = await supabase
    .from('clinic_settings')
    .select('setting_value')
    .eq('clinic_id', clinicId)
    .eq('setting_key', 'line')
    .maybeSingle();

  console.log('【LINE Access Token】');
  if (lineSettings?.setting_value?.channel_access_token) {
    const token = lineSettings.setting_value.channel_access_token;
    const isTestToken = token.startsWith('test-');
    console.log(`   ${token.substring(0, 30)}...`);
    console.log(`   ${isTestToken ? '❌ テストトークン（LINE APIは呼べません）' : '✅ 本番トークン'}`);
  } else {
    console.log('   ❌ 未設定');
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('【結論】\n');

  const hasRichMenuIds = richMenuSettings?.setting_value?.line_registered_rich_menu_id &&
                         richMenuSettings?.setting_value?.line_unregistered_rich_menu_id;
  const hasRealToken = lineSettings?.setting_value?.channel_access_token &&
                       !lineSettings.setting_value.channel_access_token.startsWith('test-');

  if (!hasRichMenuIds) {
    console.log('❌ リッチメニューIDが未設定です');
    console.log('   → 設定ページで「既存メニューを自動読み込み」を実行してください');
  } else if (!hasRealToken) {
    console.log('❌ 本番のChannel Access Tokenが未設定です');
    console.log('   → 設定ページでLINEの本番トークンを設定してください');
    console.log('   → 現在はテストトークンなのでLINE APIを呼べません');
  } else {
    console.log('⚠️  設定は正しいはずですが、リッチメニューが切り替わっていない場合:');
    console.log('   1. /api/line/switch-rich-menu が正常に呼ばれているか確認');
    console.log('   2. LINE APIのエラーレスポンスを確認');
    console.log('   3. ブラウザのコンソール(F12)でエラーログを確認');
  }

} else {
  console.log('   ❌ 過去1時間に連携はありません\n');
  console.log('もう一度LINEアプリから患者連携を実行してください。');
}
