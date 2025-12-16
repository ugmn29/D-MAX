const CHANNEL_ACCESS_TOKEN = '6bl58DetQhDHVMxbICvGYb6aWEbxSq7RrKAqGn7Fzg8iLOKAR+ieSx/YSEGIl4rFsKpEk8vZGhsHCnJKOVBphDv0Ao6FfaM7C1RH8VNPtPIbnXyYE8cW9s/g/pBq/fk3fBqGe9r8DdpNK3/a8UiBOQdB04t89/1O/w1cDnyilFU=';

console.log('🔍 デフォルトリッチメニューを確認\n');

// デフォルトリッチメニューIDを取得
const response = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
  headers: {
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
});

if (response.status === 404) {
  console.log('❌ デフォルトリッチメニューは設定されていません');
  console.log('   → 未連携ユーザーにはリッチメニューが表示されません');
  process.exit(0);
}

if (!response.ok) {
  const error = await response.json();
  console.error('❌ エラー:', error);
  process.exit(1);
}

const result = await response.json();
const defaultRichMenuId = result.richMenuId;

console.log(`✅ デフォルトリッチメニューID: ${defaultRichMenuId}\n`);

// メニューの詳細を取得
const menuResponse = await fetch(`https://api.line.me/v2/bot/richmenu/${defaultRichMenuId}`, {
  headers: {
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
});

const menuData = await menuResponse.json();

console.log('【デフォルトメニューの詳細】');
console.log(`   名前: ${menuData.name}`);
console.log(`   チャットバー: ${menuData.chatBarText}`);
console.log(`   ボタン数: ${menuData.areas?.length || 0}`);
console.log('');

// 画像の確認
const imageResponse = await fetch(
  `https://api-data.line.me/v2/bot/richmenu/${defaultRichMenuId}/content`,
  {
    method: 'HEAD',
    headers: {
      'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
    }
  }
);

console.log(`   画像: ${imageResponse.ok ? '✅ あり' : '❌ なし'}`);
console.log('');

console.log('='.repeat(60));
console.log('【結論】\n');
console.log('このデフォルトリッチメニューが未連携ユーザーに表示されています。');
console.log('');
console.log('このメニューと同じ方法で連携済みメニューを作成すれば、');
console.log('画像付きで正しく表示されます。');
