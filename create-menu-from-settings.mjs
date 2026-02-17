// 設定ページと全く同じロジックでリッチメニューを作成
console.log('🎨 設定ページのロジックでリッチメニューを作成\n');

const baseUrl = 'https://shikabot-mu.vercel.app';
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111';

// 未連携用のデフォルトボタン（設定ページと同じ）
const unregisteredRichMenuButtons = [
  { id: 1, label: "初回登録", action: "url", url: "/line-registration", icon: "user" },
  { id: 2, label: "Webサイト", action: "url", url: "", icon: "web" },
  { id: 3, label: "お問合せ", action: "message", url: "CONTACT_REQUEST", icon: "chat" },
];

console.log('ボタン設定:');
unregisteredRichMenuButtons.forEach(btn => {
  console.log(`  - ${btn.label} (${btn.action}: ${btn.url})`);
});
console.log('');

// 未連携メニュー: 3列グリッドレイアウト
const cols = 3;
const rows = 1;
const cellWidth = 2500 / cols;
const cellHeight = 1686 / rows;

const areas = unregisteredRichMenuButtons.map((btn, index) => {
  const col = index % cols;
  const row = Math.floor(index / cols);

  let actionUri = btn.url;
  if (btn.action === "url") {
    if (!actionUri || actionUri === "" || actionUri === "/") {
      actionUri = `${baseUrl}/`;
    } else if (actionUri.startsWith("/")) {
      actionUri = `${baseUrl}${actionUri}`;
    }
  }

  return {
    bounds: {
      x: col * cellWidth,
      y: row * cellHeight,
      width: cellWidth,
      height: cellHeight
    },
    action: {
      type: btn.action === "message" ? "message" : "uri",
      ...(btn.action === "message"
        ? { text: btn.url || "お問い合わせ" }
        : { uri: actionUri }
      )
    }
  };
});

// 1. リッチメニューを作成
console.log('📌 ステップ1: リッチメニュー作成');
const createResponse = await fetch(`${baseUrl}/api/line/create-rich-menu`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clinic_id: DEMO_CLINIC_ID,
    name: "未連携ユーザー用リッチメニュー",
    chatBarText: "はじめに",
    areas: areas,
    size: { width: 2500, height: 1686 },
    selected: true,
    menu_type: "unregistered"
  }),
});

if (!createResponse.ok) {
  console.error('❌ 作成失敗');
  process.exit(1);
}

const createResult = await createResponse.json();
const richMenuId = createResult.richMenuId;
console.log('✅ 作成成功:', richMenuId);

// 2. 画像をアップロード（設定ページと同じパラメータ）
console.log('\n📌 ステップ2: 画像アップロード');
console.log('ボタンラベル:', unregisteredRichMenuButtons.map(b => b.label).join(', '));

const uploadResponse = await fetch(`${baseUrl}/api/line/upload-rich-menu-image`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clinic_id: DEMO_CLINIC_ID,
    rich_menu_id: richMenuId,
    buttons: unregisteredRichMenuButtons,  // ラベル情報を含むボタン配列
    menu_type: "unregistered"
  }),
});

if (!uploadResponse.ok) {
  const error = await uploadResponse.json();
  console.error('❌ アップロード失敗:', error);
  process.exit(1);
}

console.log('✅ アップロード成功');

// 3. データベースに保存
console.log('\n📌 ステップ3: データベースに保存');
const saveResponse = await fetch(`${baseUrl}/api/line/save-rich-menu-ids`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clinic_id: DEMO_CLINIC_ID,
    unregistered_menu_id: richMenuId
  }),
});

if (!saveResponse.ok) {
  console.error('❌ 保存失敗');
  process.exit(1);
}

console.log('✅ 保存成功');

// 4. デフォルトメニューとして設定
console.log('\n📌 ステップ4: デフォルトメニューに設定');
const defaultResponse = await fetch(`${baseUrl}/api/line/set-default-rich-menu`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    clinic_id: DEMO_CLINIC_ID,
    rich_menu_id: richMenuId
  }),
});

if (!defaultResponse.ok) {
  console.error('❌ デフォルト設定失敗');
  process.exit(1);
}

console.log('✅ デフォルト設定成功');

console.log('\n' + '='.repeat(60));
console.log('🎉 設定ページと同じロジックでメニューを作成しました');
console.log('=' .repeat(60));
console.log('\nリッチメニューID:', richMenuId);
console.log('ボタンラベル: 初回登録、Webサイト、お問合せ');
console.log('\n📱 LINEアプリを再起動して確認してください');
