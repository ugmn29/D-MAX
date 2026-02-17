import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://obdfmwpdkwraqqqyjgwu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDk3NTkzMCwiZXhwIjoyMDQ2NTUxOTMwfQ.AuBYte-x23H2dKxZC7qK6aZxmJpTsvVXAo3hYsWTW5Y';

const supabase = createClient(PROD_URL, SERVICE_ROLE_KEY);

console.log('🔄 未連携リッチメニューを削除して再作成\n');

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

// リッチメニュー設定を取得
const { data: richMenuSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', '11111111-1111-1111-1111-111111111111')
  .eq('setting_key', 'line_rich_menu')
  .single();

const currentUnregisteredMenuId = richMenuSettings?.setting_value?.line_unregistered_rich_menu_id;

console.log('【現在の設定】');
console.log('未連携メニューID:', currentUnregisteredMenuId || 'なし');
console.log('');

// 1. 現在のデフォルトメニューを解除
console.log('📌 ステップ1: デフォルトメニューを解除');
const unlinkResponse = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
});

if (unlinkResponse.ok) {
  console.log('✅ デフォルトメニューを解除しました');
} else {
  const error = await unlinkResponse.text();
  console.log('⚠️  デフォルトメニュー解除:', error);
}
console.log('');

// 2. 古いリッチメニューを削除
if (currentUnregisteredMenuId) {
  console.log('📌 ステップ2: 古いリッチメニューを削除');
  const deleteResponse = await fetch(
    `https://api.line.me/v2/bot/richmenu/${currentUnregisteredMenuId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      }
    }
  );

  if (deleteResponse.ok) {
    console.log('✅ 古いリッチメニューを削除しました');
  } else {
    const error = await deleteResponse.text();
    console.log('⚠️  削除エラー:', error);
  }
  console.log('');
}

// 3. 新しいリッチメニューを作成（APIを使用）
console.log('📌 ステップ3: 新しいリッチメニューを作成');

const createResponse = await fetch('https://shikabot-mu.vercel.app/api/line/create-rich-menu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    menu_type: 'unregistered',
    name: '未連携用リッチメニュー',
    chatBarText: 'メニュー',
    size: { width: 2500, height: 1686 },
    selected: false,
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 1686 },
        action: { type: 'uri', uri: 'https://line.me/R/nv/QRCodeReader' }
      },
      {
        bounds: { x: 833, y: 0, width: 833, height: 1686 },
        action: { type: 'uri', uri: 'https://shikabot-mu.vercel.app' }
      },
      {
        bounds: { x: 1666, y: 0, width: 834, height: 1686 },
        action: { type: 'uri', uri: 'https://shikabot-mu.vercel.app/contact' }
      }
    ]
  })
});

if (!createResponse.ok) {
  const error = await createResponse.json();
  console.error('❌ リッチメニュー作成失敗:', error);
  process.exit(1);
}

const createResult = await createResponse.json();
const newMenuId = createResult.richMenuId;
console.log('✅ 新しいリッチメニューを作成しました');
console.log('   新しいID:', newMenuId);
console.log('');

// 4. 画像をアップロード
console.log('📌 ステップ4: 画像をアップロード');

const uploadResponse = await fetch('https://shikabot-mu.vercel.app/api/line/upload-rich-menu-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    rich_menu_id: newMenuId,
    menu_type: 'unregistered',
    buttons: [
      { label: '初回登録' },
      { label: 'Webサイト' },
      { label: 'お問合せ' }
    ]
  })
});

if (!uploadResponse.ok) {
  const error = await uploadResponse.json();
  console.error('❌ 画像アップロード失敗:', error);
  process.exit(1);
}

console.log('✅ 画像をアップロードしました');
console.log('');

// 5. IDを保存
console.log('📌 ステップ5: 新しいIDをデータベースに保存');

const saveResponse = await fetch('https://shikabot-mu.vercel.app/api/line/save-rich-menu-ids', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    unregistered_menu_id: newMenuId
  })
});

if (!saveResponse.ok) {
  const error = await saveResponse.json();
  console.error('❌ ID保存失敗:', error);
  process.exit(1);
}

console.log('✅ IDを保存しました');
console.log('');

// 6. デフォルトメニューとして設定
console.log('📌 ステップ6: デフォルトメニューとして設定');

const setDefaultResponse = await fetch(
  `https://api.line.me/v2/bot/user/all/richmenu/${newMenuId}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
    }
  }
);

if (setDefaultResponse.ok) {
  console.log('✅ デフォルトメニューとして設定しました');
} else {
  const error = await setDefaultResponse.text();
  console.error('❌ デフォルトメニュー設定失敗:', error);
  process.exit(1);
}

console.log('');
console.log('🎉 完了しました！LINEアプリでリッチメニューを確認してください。');
