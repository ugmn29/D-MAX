import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📋 LINE設定状況を確認中...\n');

// LINE設定を取得
const { data: lineSettings, error } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('setting_key', 'line')
  .maybeSingle();

if (error) {
  console.error('❌ エラー:', error);
  process.exit(1);
}

// リッチメニュー設定を取得
const { data: richMenuSettings, error: richMenuError } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

if (richMenuError) {
  console.error('❌ エラー:', richMenuError);
}

console.log('📊 LINE設定:\n');

if (lineSettings && lineSettings.setting_value) {
  const line = lineSettings.setting_value;
  console.log('Channel Access Token:', line.channel_access_token
    ? `✅ 設定済み (${line.channel_access_token.substring(0, 20)}...)`
    : '❌ 未設定');
  console.log('Channel Secret:', line.channel_secret ? '✅ 設定済み' : '❌ 未設定');
  console.log('Webhook URL:', line.webhook_url || '❌ 未設定');
} else {
  console.log('❌ LINE設定が見つかりません');
}

console.log('\n📋 リッチメニューID:');

if (richMenuSettings && richMenuSettings.setting_value) {
  const richMenu = richMenuSettings.setting_value;
  console.log('連携済み用:', richMenu.line_registered_rich_menu_id || '❌ 未設定');
  console.log('未連携用:', richMenu.line_unregistered_rich_menu_id || '❌ 未設定');

  if (richMenu.line_registered_rich_menu_id && richMenu.line_unregistered_rich_menu_id) {
    console.log('\n✅ リッチメニューは設定済みです！');
    console.log('\n💡 連携後のリッチメニュー切り替えが自動で動作します');
  } else {
    console.log('\n⚠️ リッチメニューが未設定です');
    console.log('\n💡 次のステップ:');
    console.log('1. 設定画面から「LINE通知」タブを開く');
    console.log('2. 「リッチメニューを作成」ボタンをクリック');
    console.log('3. 作成完了後、リッチメニューIDが自動保存されます');
  }
} else {
  console.log('❌ リッチメニュー設定が見つかりません');
  console.log('\n💡 次のステップ:');
  console.log('1. 設定画面から「LINE通知」タブを開く');
  console.log('2. 「リッチメニューを作成」ボタンをクリック');
  console.log('3. 作成完了後、リッチメニューIDが自動保存されます');
}
