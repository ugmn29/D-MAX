import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://obdfmwpdkwraqqqyjgwu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDk3NTkzMCwiZXhwIjoyMDQ2NTUxOTMwfQ.AuBYte-x23H2dKxZC7qK6aZxmJpTsvVXAo3hYsWTW5Y';

const supabase = createClient(PROD_URL, SERVICE_ROLE_KEY);

console.log('🔍 デフォルトリッチメニューを確認・修正\n');

// LINE設定を取得
const { data: lineSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', '11111111-1111-1111-1111-111111111111')
  .eq('setting_key', 'line')
  .single();

if (!lineSettings?.setting_value?.channel_access_token) {
  console.error('❌ Channel Access Tokenが見つかりません');
  process.exit(1);
}

const CHANNEL_ACCESS_TOKEN = lineSettings.setting_value.channel_access_token;

// リッチメニューID設定を取得
const { data: richMenuSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', '11111111-1111-1111-1111-111111111111')
  .eq('setting_key', 'line_rich_menu')
  .single();

const unregisteredMenuId = richMenuSettings?.setting_value?.line_unregistered_rich_menu_id;

console.log('【データベース設定】');
console.log('未連携メニューID:', unregisteredMenuId);
console.log('');

if (!unregisteredMenuId) {
  console.error('❌ 未連携メニューIDが設定されていません');
  process.exit(1);
}

// 現在のデフォルトメニューを確認
const defaultResponse = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
  headers: {
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
});

let currentDefaultId = null;
if (defaultResponse.ok) {
  const result = await defaultResponse.json();
  currentDefaultId = result.richMenuId;
}

console.log('【現在のデフォルトメニュー】');
console.log('ID:', currentDefaultId || '❌ 設定なし');
console.log('');

if (currentDefaultId === unregisteredMenuId) {
  console.log('✅ 正しく設定されています');
} else {
  console.log('⚠️  デフォルトメニューが未連携用と異なります');
  console.log('');
  console.log('🔧 修正中...');

  // デフォルトメニューを設定
  const setDefaultResponse = await fetch(
    `https://api.line.me/v2/bot/user/all/richmenu/${unregisteredMenuId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      }
    }
  );

  if (setDefaultResponse.ok) {
    console.log('✅ デフォルトメニューを修正しました');
    console.log('   新しいデフォルトID:', unregisteredMenuId);
  } else {
    const error = await setDefaultResponse.json();
    console.error('❌ デフォルトメニュー設定失敗:', error);
  }
}
