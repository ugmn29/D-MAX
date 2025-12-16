// 現在のデフォルトリッチメニューを確認
const CHANNEL_ACCESS_TOKEN = '6bl58DetQhDHVMxbICvGYb6aWEbxSq7RrKAqGn7Fzg8iLOKAR+ieSx/YSEGIl4rFsKpEk8vZGhsHCnJKOVBphDv0Ao6FfaM7C1RH8VNPtPIbnXyYE8cW9s/g/pBq/fk3fBqGe9r8DdpNK3/a8UiBOQdB04t89/1O/w1cDnyilFU=';

console.log('🔍 現在のリッチメニュー状態を確認\n');

// 1. デフォルトリッチメニューを取得
console.log('【デフォルトリッチメニュー】');
const defaultResponse = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
  headers: {
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
});

if (defaultResponse.ok) {
  const result = await defaultResponse.json();
  console.log('現在のデフォルトID:', result.richMenuId);
} else {
  const error = await defaultResponse.text();
  console.log('エラー:', error);
}
console.log('');

// 2. データベースの設定を確認
console.log('【データベース設定】');
const dbResponse = await fetch('https://dmax-mu.vercel.app/api/line/get-default-menu?clinic_id=11111111-1111-1111-1111-111111111111');

if (dbResponse.ok) {
  const dbResult = await dbResponse.json();
  console.log('DB未連携メニューID:', dbResult.unregisteredMenuId);
  console.log('DB連携済みメニューID:', dbResult.registeredMenuId);
} else {
  console.log('DB取得エラー');
}
console.log('');

// 3. 全リッチメニューをリスト
console.log('【すべてのリッチメニュー】');
const listResponse = await fetch('https://api.line.me/v2/bot/richmenu/list', {
  headers: {
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
});

if (listResponse.ok) {
  const menus = await listResponse.json();
  console.log(`合計: ${menus.richmenus?.length || 0}個`);
  menus.richmenus?.forEach((menu, index) => {
    console.log(`\n${index + 1}. ID: ${menu.richMenuId}`);
    console.log(`   名前: ${menu.name}`);
    console.log(`   チャットバー: ${menu.chatBarText}`);
    console.log(`   選択状態: ${menu.selected}`);
  });
}
