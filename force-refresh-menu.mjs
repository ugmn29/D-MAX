// デフォルトメニューを一度解除してから再設定することで強制更新
console.log('🔄 リッチメニューを強制更新\n');

const newMenuId = 'richmenu-e0a7d82120f985f18a8d26d6c5b5be32';

// 1. デフォルトメニューを解除
console.log('📌 ステップ1: デフォルトメニューを解除');
const unlinkResponse = await fetch('https://shikabot-mu.vercel.app/api/line/unlink-default-menu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111'
  })
});

if (unlinkResponse.ok) {
  console.log('✅ デフォルトメニューを解除しました');
} else {
  const error = await unlinkResponse.json();
  console.log('解除結果:', error);
}

// 2秒待機
console.log('\n⏳ 2秒待機...');
await new Promise(resolve => setTimeout(resolve, 2000));

// 2. 新しいメニューをデフォルトに設定
console.log('\n📌 ステップ2: 新しいメニューをデフォルトに設定');
const setResponse = await fetch('https://shikabot-mu.vercel.app/api/line/set-default-rich-menu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    rich_menu_id: newMenuId
  })
});

const result = await setResponse.json();
if (setResponse.ok) {
  console.log('✅ 新しいメニューを設定しました');
  console.log('メニューID:', result.richMenuId);
} else {
  console.error('❌ 設定失敗:', result);
}

console.log('\n📱 LINEアプリで以下を実行してください:');
console.log('1. トーク画面を完全に閉じる（バックグラウンドから削除）');
console.log('2. LINEアプリを完全に終了');
console.log('3. LINEアプリを再起動');
console.log('4. トーク画面を開く');
console.log('\nこれでリッチメニューが更新されるはずです。');
