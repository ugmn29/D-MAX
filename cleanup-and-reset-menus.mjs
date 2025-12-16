// 古いリッチメニューを全て削除して新しいものだけを残す
console.log('🧹 古いリッチメニューをクリーンアップ\n');

const keepMenuIds = [
  'richmenu-e0a7d82120f985f18a8d26d6c5b5be32', // 新しい未連携メニュー
  'richmenu-e3e30ca306dbf0452580b24248025a39'  // 連携済みメニュー（データベースに保存されている）
];

console.log('保持するメニュー:');
keepMenuIds.forEach(id => console.log(' -', id));
console.log('');

// 1. すべてのリッチメニューを取得
console.log('📌 ステップ1: すべてのリッチメニューを取得');
const listResponse = await fetch('https://dmax-mu.vercel.app/api/line/list-rich-menus?clinic_id=11111111-1111-1111-1111-111111111111');
const listResult = await listResponse.json();

const allMenus = listResult.richmenus || [];
console.log(`合計: ${allMenus.length}個のリッチメニューが存在\n`);

// 2. 削除するメニューをフィルター
const menusToDelete = allMenus.filter(menu => !keepMenuIds.includes(menu.richMenuId));

console.log(`削除対象: ${menusToDelete.length}個`);
console.log(`保持: ${keepMenuIds.length}個\n`);

// 3. 削除実行（まとめて削除）
if (menusToDelete.length > 0) {
  console.log('📌 ステップ2: 古いリッチメニューを削除中...\n');

  let deleteCount = 0;
  for (const menu of menusToDelete) {
    try {
      const deleteResponse = await fetch('https://dmax-mu.vercel.app/api/line/delete-rich-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: '11111111-1111-1111-1111-111111111111',
          rich_menu_id: menu.richMenuId
        })
      });

      if (deleteResponse.ok) {
        deleteCount++;
        if (deleteCount % 10 === 0) {
          console.log(`  削除済み: ${deleteCount}/${menusToDelete.length}`);
        }
      }
    } catch (err) {
      console.log(`  ⚠️  削除エラー (${menu.richMenuId}):`, err.message);
    }
  }

  console.log(`\n✅ ${deleteCount}個のリッチメニューを削除しました\n`);
}

// 4. 新しいメニューをデフォルトに設定
console.log('📌 ステップ3: 新しいメニューをデフォルトに設定');
const setResponse = await fetch('https://dmax-mu.vercel.app/api/line/set-default-rich-menu', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    rich_menu_id: 'richmenu-e0a7d82120f985f18a8d26d6c5b5be32'
  })
});

if (setResponse.ok) {
  console.log('✅ デフォルトメニューを設定しました\n');
} else {
  const error = await setResponse.json();
  console.error('❌ 設定失敗:', error, '\n');
}

console.log('🎉 クリーンアップ完了！');
console.log('\nLINEアプリで以下を実行してください:');
console.log('1. トーク画面を完全に閉じる');
console.log('2. LINEアプリを完全に終了（バックグラウンドから削除）');
console.log('3. LINEアプリを再起動');
console.log('4. トーク画面を開く');
