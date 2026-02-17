// 新しいリッチメニューをデフォルトに設定
console.log('🔄 新しいリッチメニューをデフォルトに設定\n');

const newMenuId = 'richmenu-e0a7d82120f985f18a8d26d6c5b5be32';

const response = await fetch('https://shikabot-mu.vercel.app/api/line/set-default-rich-menu', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    rich_menu_id: newMenuId
  })
});

const result = await response.json();

if (response.ok) {
  console.log('✅ 成功:', result.message);
  console.log('リッチメニューID:', result.richMenuId);
} else {
  console.error('❌ 失敗:', result);
}

console.log('\n📌 次のステップ:');
console.log('LINEアプリでトーク画面を完全に閉じて（バックグラウンドから削除）、');
console.log('再度開いてリッチメニューを確認してください。');
