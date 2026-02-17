// Channel Access Tokenを直接使用してリッチメニューを修正
const CHANNEL_ACCESS_TOKEN = '6bl58DetQhDHVMxbICvGYb6aWEbxSq7RrKAqGn7Fzg8iLOKAR+ieSx/YSEGIl4rFsKpEk8vZGhsHCnJKOVBphDv0Ao6FfaM7C1RH8VNPtPIbnXyYE8cW9s/g/pBq/fk3fBqGe9r8DdpNK3/a8UiBOQdB04t89/1O/w1cDnyilFU=';

console.log('🔄 未連携リッチメニューを修正\n');

// 1. 現在のデフォルトメニューを確認
console.log('📌 ステップ1: 現在のデフォルトメニューを確認');
const currentDefaultResponse = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
  headers: {
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
});

let currentDefaultId = null;
if (currentDefaultResponse.ok) {
  const result = await currentDefaultResponse.json();
  currentDefaultId = result.richMenuId;
  console.log('現在のデフォルトID:', currentDefaultId);
} else {
  console.log('デフォルトメニューなし');
}
console.log('');

// 2. デフォルトメニューを解除
if (currentDefaultId) {
  console.log('📌 ステップ2: デフォルトメニューを解除');
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
    console.log('⚠️  解除エラー:', error);
  }
  console.log('');

  // 3. 古いメニューを削除
  console.log('📌 ステップ3: 古いメニューを削除');
  const deleteResponse = await fetch(
    `https://api.line.me/v2/bot/richmenu/${currentDefaultId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      }
    }
  );

  if (deleteResponse.ok) {
    console.log('✅ 古いメニューを削除しました');
  } else {
    const error = await deleteResponse.text();
    console.log('⚠️  削除エラー:', error);
  }
  console.log('');
}

// 4. 新しいリッチメニューを作成
console.log('📌 ステップ4: 新しいリッチメニューを作成');

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

// 5. 画像をアップロード
console.log('📌 ステップ5: 画像をアップロード');

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
  const errorText = await uploadResponse.text();
  console.error('❌ 画像アップロード失敗:');
  console.error(errorText);

  // エラーでも続行
  console.log('⚠️  画像アップロードに失敗しましたが続行します');
} else {
  console.log('✅ 画像をアップロードしました');
}
console.log('');

// 6. IDを保存
console.log('📌 ステップ6: 新しいIDをデータベースに保存');

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
} else {
  console.log('✅ IDを保存しました');
}
console.log('');

// 7. デフォルトメニューとして設定
console.log('📌 ステップ7: デフォルトメニューとして設定');

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
}

console.log('');
console.log('🎉 完了しました！LINEアプリでリッチメニューを確認してください。');
console.log('');
console.log('注意: LINEアプリでメニューが更新されるまで数秒かかる場合があります。');
console.log('      トーク画面を一度閉じて再度開いてください。');
