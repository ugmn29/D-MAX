import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 リッチメニュー切り替え機能の診断\n');
console.log('='.repeat(60));

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
console.log(`\n🏥 クリニック: ${clinics[0].name}\n`);

// チェック1: LINE基本設定
console.log('【チェック1】LINE基本設定 (line キー)');
const { data: lineSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

if (lineSettings?.setting_value) {
  const line = lineSettings.setting_value;
  const hasRealToken = line.channel_access_token && !line.channel_access_token.startsWith('test-');

  console.log(`   Channel Access Token: ${line.channel_access_token?.substring(0, 20)}...`);
  console.log(`   Channel Secret: ${line.channel_secret ? '****' : '未設定'}`);
  console.log(`   ${hasRealToken ? '✅' : '❌'} ${hasRealToken ? '本番トークン' : 'テストトークン（LINE APIは呼べません）'}`);
} else {
  console.log('   ❌ LINE基本設定が見つかりません');
}

console.log('');

// チェック2: リッチメニューID
console.log('【チェック2】リッチメニューID設定 (line_rich_menu キー)');
const { data: richMenuSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

let hasRegistered = false;
let hasUnregistered = false;

if (richMenuSettings?.setting_value) {
  const richMenu = richMenuSettings.setting_value;
  hasRegistered = !!richMenu.line_registered_rich_menu_id;
  hasUnregistered = !!richMenu.line_unregistered_rich_menu_id;

  console.log(`   連携済みメニューID: ${hasRegistered ? '✅ ' + richMenu.line_registered_rich_menu_id : '❌ 未設定'}`);
  console.log(`   未連携メニューID: ${hasUnregistered ? '✅ ' + richMenu.line_unregistered_rich_menu_id : '❌ 未設定'}`);
} else {
  console.log('   ❌ リッチメニューID設定が見つかりません');
}

console.log('');

// チェック3: 患者連携履歴
console.log('【チェック3】患者連携履歴');
const { data: linkages } = await supabase
  .from('line_patient_linkages')
  .select('id, line_user_id, patient_id, created_at')
  .eq('clinic_id', clinicId)
  .order('created_at', { ascending: false })
  .limit(1);

if (linkages && linkages.length > 0) {
  console.log(`   ✅ 最新の連携: ${new Date(linkages[0].created_at).toLocaleString('ja-JP')}`);
  console.log(`   LINE User ID: ${linkages[0].line_user_id}`);
} else {
  console.log('   ❌ 連携履歴がありません');
}

console.log('\n' + '='.repeat(60));
console.log('【診断結果】\n');

const hasLineSettings = !!lineSettings?.setting_value;
const hasRealToken = lineSettings?.setting_value?.channel_access_token && !lineSettings.setting_value.channel_access_token.startsWith('test-');
const hasBothMenuIds = hasRegistered && hasUnregistered;
const hasLinkage = linkages && linkages.length > 0;

if (hasLineSettings && hasRealToken && hasBothMenuIds) {
  console.log('✅ すべての設定が完了しています！');
  console.log('   リッチメニュー切り替えが動作するはずです。');

  if (!hasLinkage) {
    console.log('\n💡 次のステップ:');
    console.log('   1. LINEアプリで患者連携を実行');
    console.log('   2. リッチメニューが切り替わることを確認');
  }
} else {
  console.log('❌ 設定が不足しています:\n');

  if (!hasLineSettings) {
    console.log('   【必須】LINE基本設定が未登録');
    console.log('   → 設定ページの「通知」タブ → 「接続設定」で保存');
  } else if (!hasRealToken) {
    console.log('   【必須】テストトークンでは動作しません');
    console.log('   → LINE Developersで取得した本番のトークンを設定');
  }

  if (!hasRegistered || !hasUnregistered) {
    console.log('   【必須】リッチメニューIDが未設定');
    console.log('   → 設定ページの「LINEリッチメニュー」タブで両方のメニューを登録');

    if (!hasRegistered) {
      console.log('     - 「連携済みユーザー用」を登録');
    }
    if (!hasUnregistered) {
      console.log('     - 「未連携ユーザー用」を登録');
    }
  }
}

console.log('\n' + '='.repeat(60));
