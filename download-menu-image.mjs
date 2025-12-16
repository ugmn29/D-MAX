import fs from 'fs';

// LINE APIから実際にアップロードされた画像をダウンロードして確認
const CHANNEL_ACCESS_TOKEN = '6bl58DetQhDHVMxbICvGYb6aWEbxSq7RrKAqGn7Fzg8iLOKAR+ieSx/YSEGIl4rFsKpEk8vZGhsHCnJKOVBphDv0Ao6FfaM7C1RH8VNPtPIbnXyYE8cW9s/g/pBq/fk3fBqGe9r8DdpNK3/a8UiBOQdB04t89/1O/w1cDnyilFU=';
const menuId = 'richmenu-e0a7d82120f985f18a8d26d6c5b5be32';

console.log('🔍 LINE APIから実際の画像をダウンロード\n');
console.log('メニューID:', menuId);

// 1. リッチメニュー情報を取得
console.log('\n📌 リッチメニュー情報を取得中...');
const infoResponse = await fetch(`https://api.line.me/v2/bot/richmenu/${menuId}`, {
  headers: {
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
});

if (infoResponse.ok) {
  const info = await infoResponse.json();
  console.log('✅ リッチメニュー情報:');
  console.log(JSON.stringify(info, null, 2));
} else {
  const error = await infoResponse.text();
  console.error('❌ 情報取得エラー:', error);
  process.exit(1);
}

// 2. 画像をダウンロード
console.log('\n📌 画像をダウンロード中...');
const imageResponse = await fetch(`https://api-data.line.me/v2/bot/richmenu/${menuId}/content`, {
  headers: {
    'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
  }
});

if (imageResponse.ok) {
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const filename = '/Users/fukunagashindai/Downloads/D-MAX/actual-line-menu.png';
  fs.writeFileSync(filename, buffer);
  console.log('✅ 画像をダウンロードしました:', filename);
  console.log('   サイズ:', buffer.length, 'bytes');
  console.log('\nこのファイルを開いて、実際にLINE APIに保存されている画像を確認してください。');
} else {
  const error = await imageResponse.text();
  console.error('❌ 画像ダウンロードエラー:', error);
}
