// 詳細調査：リッチメニューの状態を完全に確認
console.log('🔍 詳細調査開始\n');
console.log('=' .repeat(60));

// 1. データベースに保存されているメニューIDを確認
console.log('\n【1. データベースの設定】');
const dbResponse = await fetch('https://shikabot-mu.vercel.app/api/line/diagnose?clinic_id=11111111-1111-1111-1111-111111111111');
const dbData = await dbResponse.json();

console.log('未連携メニューID:', dbData.richMenuSettings.unregisteredMenuId);
console.log('連携済みメニューID:', dbData.richMenuSettings.registeredMenuId);

const dbUnregisteredId = dbData.richMenuSettings.unregisteredMenuId;

// 2. 現在のデフォルトリッチメニューを確認
console.log('\n【2. 現在のデフォルトメニュー】');
const defaultCheckResponse = await fetch('https://shikabot-mu.vercel.app/api/line/check-user-menu?clinic_id=11111111-1111-1111-1111-111111111111');

if (defaultCheckResponse.ok) {
  const defaultData = await defaultCheckResponse.json();
  console.log('デフォルトメニューID:', defaultData.defaultRichMenuId || 'なし');

  if (defaultData.defaultRichMenuId === dbUnregisteredId) {
    console.log('✅ データベースと一致しています');
  } else {
    console.log('❌ データベースと不一致！');
    console.log('   期待値:', dbUnregisteredId);
    console.log('   実際値:', defaultData.defaultRichMenuId);
  }
} else {
  console.log('⚠️  デフォルトメニュー確認API呼び出し失敗');
}

// 3. データベースのメニューIDの画像が存在するか確認
console.log('\n【3. データベースのメニューIDの画像確認】');
const imageCheckResponse = await fetch(`https://shikabot-mu.vercel.app/api/line/check-menu-image?clinic_id=11111111-1111-1111-1111-111111111111&rich_menu_id=${dbUnregisteredId}`);

if (imageCheckResponse.ok) {
  const imageData = await imageCheckResponse.json();
  console.log('画像の有無:', imageData.hasImage ? '✅ あり' : '❌ なし');
  console.log('メニュー名:', imageData.menuData?.name);
  console.log('チャットバー:', imageData.menuData?.chatBarText);
  console.log('エリア数:', imageData.menuData?.areas);
} else {
  console.log('❌ 画像確認API呼び出し失敗');
}

// 4. すべてのリッチメニューから該当IDを検索
console.log('\n【4. 全リッチメニュー中の該当ID検索】');
const listResponse = await fetch('https://shikabot-mu.vercel.app/api/line/list-rich-menus?clinic_id=11111111-1111-1111-1111-111111111111');
const listData = await listResponse.json();

const targetMenu = listData.richmenus?.find(m => m.richMenuId === dbUnregisteredId);

if (targetMenu) {
  console.log('✅ メニューが存在します');
  console.log('名前:', targetMenu.name);
  console.log('サイズ:', `${targetMenu.size.width}x${targetMenu.size.height}`);
  console.log('選択状態:', targetMenu.selected);
  console.log('エリア数:', targetMenu.areas?.length);
  console.log('\nアクション一覧:');
  targetMenu.areas?.forEach((area, i) => {
    console.log(`  ${i + 1}. ${area.action.type}:`, area.action.uri || area.action.text);
  });
} else {
  console.log('❌ メニューが見つかりません！');
  console.log('データベースのIDが無効です');
}

// 5. 最近作成されたメニューを確認
console.log('\n【5. 最近作成された未連携メニュー】');
const recentUnregistered = listData.richmenus?.filter(m =>
  m.name.includes('未連携') || m.chatBarText.includes('メニュー')
).slice(-5);

console.log(`最新5件:`);
recentUnregistered?.forEach((menu, i) => {
  console.log(`\n${i + 1}. ID: ${menu.richMenuId}`);
  console.log(`   名前: ${menu.name}`);
  console.log(`   チャットバー: ${menu.chatBarText}`);
  console.log(`   サイズ: ${menu.size.width}x${menu.size.height}`);
  console.log(`   エリア数: ${menu.areas?.length}`);
});

// 6. 結論
console.log('\n' + '='.repeat(60));
console.log('【結論】');

if (defaultData?.defaultRichMenuId === dbUnregisteredId && imageData?.hasImage) {
  console.log('✅ 設定は正しいです');
  console.log('\n考えられる原因:');
  console.log('1. LINEアプリが古い画像をキャッシュしている');
  console.log('2. 画像は正しく生成されたが、LINEサーバーの反映に時間がかかっている');
  console.log('\n対策:');
  console.log('- LINEアプリを完全に再起動（バックグラウンドから削除）');
  console.log('- 数分待ってから再度確認');
  console.log('- スマートフォンを再起動');
} else {
  console.log('❌ 設定に問題があります');
  console.log('\n問題点:');
  if (defaultData?.defaultRichMenuId !== dbUnregisteredId) {
    console.log('- デフォルトメニューIDがデータベースと不一致');
  }
  if (!imageData?.hasImage) {
    console.log('- メニューに画像がアップロードされていない');
  }
  console.log('\n次のステップ:');
  console.log('1. 設定ページで「保存」ボタンをもう一度クリック');
  console.log('2. 新しいメニューを生成してデフォルトに設定');
}

console.log('\n' + '='.repeat(60));
