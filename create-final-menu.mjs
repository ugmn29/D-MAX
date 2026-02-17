// 最終的な修正：新しいメニューを作成して完全に設定
console.log('🔧 最終修正：新しいリッチメニューを作成\n');

// 1. 新しいリッチメニューを作成
console.log('📌 ステップ1: リッチメニュー構造を作成');
const createResponse = await fetch('https://shikabot-mu.vercel.app/api/line/create-rich-menu', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    menu_type: 'unregistered',
    name: '未連携用リッチメニュー(最終版)',
    chatBarText: 'メニュー',
    size: { width: 2500, height: 1686 },
    selected: false,
    areas: [
      { bounds: { x: 0, y: 0, width: 833, height: 1686 }, action: { type: 'uri', uri: 'https://line.me/R/nv/QRCodeReader' }},
      { bounds: { x: 833, y: 0, width: 833, height: 1686 }, action: { type: 'uri', uri: 'https://shikabot-mu.vercel.app' }},
      { bounds: { x: 1666, y: 0, width: 834, height: 1686 }, action: { type: 'uri', uri: 'https://shikabot-mu.vercel.app/contact' }}
    ]
  })
});

if (!createResponse.ok) {
  console.error('❌ メニュー作成失敗');
  process.exit(1);
}

const createResult = await createResponse.json();
const newMenuId = createResult.richMenuId;
console.log('✅ リッチメニュー作成成功');
console.log('   ID:', newMenuId);

// 2. 画像をアップロード（修正済みのCanvas生成コードを使用）
console.log('\n📌 ステップ2: 画像をアップロード');
const uploadResponse = await fetch('https://shikabot-mu.vercel.app/api/line/upload-rich-menu-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
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
  console.error('❌ 画像アップロード失敗');
  const error = await uploadResponse.json();
  console.error(error);
  process.exit(1);
}

console.log('✅ 画像アップロード成功');

// 3. データベースに保存
console.log('\n📌 ステップ3: データベースに保存');
const saveResponse = await fetch('https://shikabot-mu.vercel.app/api/line/save-rich-menu-ids', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    unregistered_menu_id: newMenuId
  })
});

if (!saveResponse.ok) {
  console.error('❌ データベース保存失敗');
  process.exit(1);
}

console.log('✅ データベースに保存完了');

// 4. デフォルトメニューとして設定
console.log('\n📌 ステップ4: デフォルトメニューとして設定');
const setDefaultResponse = await fetch('https://shikabot-mu.vercel.app/api/line/set-default-rich-menu', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    rich_menu_id: newMenuId
  })
});

if (!setDefaultResponse.ok) {
  console.error('❌ デフォルトメニュー設定失敗');
  process.exit(1);
}

console.log('✅ デフォルトメニュー設定完了');

// 5. 確認
console.log('\n📌 ステップ5: 設定を確認');
const verifyResponse = await fetch(`https://shikabot-mu.vercel.app/api/line/diagnose?clinic_id=11111111-1111-1111-1111-111111111111`);
const verifyData = await verifyResponse.json();

console.log('データベース未連携ID:', verifyData.richMenuSettings.unregisteredMenuId);
console.log('期待値:', newMenuId);
console.log('一致:', verifyData.richMenuSettings.unregisteredMenuId === newMenuId ? '✅' : '❌');

console.log('\n' + '='.repeat(60));
console.log('🎉 すべての設定が完了しました！');
console.log('=' .repeat(60));
console.log('\n新しいリッチメニューID:', newMenuId);
console.log('\n📱 次の手順:');
console.log('1. LINEアプリを完全に終了（バックグラウンドから削除）');
console.log('2. スマートフォンを再起動（推奨）');
console.log('3. LINEアプリを起動');
console.log('4. トーク画面を開く');
console.log('\nテキストラベル（初回登録、Webサイト、お問合せ）が');
console.log('青い円の下に表示されるはずです。');
