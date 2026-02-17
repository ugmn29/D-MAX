// 古いリッチメニューを削除して新しいものをデフォルトに設定
console.log('🔄 古いリッチメニューを削除して新しいものに切り替え\n');

const newMenuId = 'richmenu-e0a7d82120f985f18a8d26d6c5b5be32';
const oldMenuId = 'richmenu-e8028d4b5719cae177bb36f817a0451c'; // データベースに保存されている古いID

// 1. デフォルトメニューを解除（本番APIを使用）
console.log('📌 ステップ1: デフォルトメニューを解除');
const unlinkResponse = await fetch('https://shikabot-mu.vercel.app/api/line/set-default-rich-menu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    rich_menu_id: '' // 空にして解除
  })
});

console.log('解除レスポンスステータス:', unlinkResponse.status);

// 2. 古いメニューを削除（APIを使用）
console.log('\n📌 ステップ2: 古いメニューを削除');
const deleteResponse = await fetch(`https://shikabot-mu.vercel.app/api/line/delete-rich-menu`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    rich_menu_id: oldMenuId
  })
});

if (deleteResponse.ok) {
  console.log('✅ 古いメニューを削除しました');
} else {
  const error = await deleteResponse.text();
  console.log('削除結果:', error);
}

// 3秒待機
console.log('\n⏳ 3秒待機...');
await new Promise(resolve => setTimeout(resolve, 3000));

// 3. 新しいメニューをデフォルトに設定
console.log('\n📌 ステップ3: 新しいメニューをデフォルトに設定');
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

console.log('\n📱 重要: LINEアプリで以下を実行してください:');
console.log('1. トーク画面を完全に閉じる');
console.log('2. LINEアプリをバックグラウンドから完全に削除');
console.log('3. スマートフォンを再起動（推奨）');
console.log('4. LINEアプリを再起動');
console.log('5. トーク画面を開く');
console.log('\nLINEはリッチメニューを積極的にキャッシュするため、');
console.log('完全に更新されるまで数分かかる場合があります。');
