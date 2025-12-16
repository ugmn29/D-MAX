// ユーザーのリッチメニューを強制更新
console.log('🔄 ユーザーのリッチメニューを強制更新\n');

const newMenuId = 'richmenu-e0a7d82120f985f18a8d26d6c5b5be32';

// 1. Webhookログから最新のLINE User IDを取得
const response = await fetch('https://dmax-mu.vercel.app/api/line/diagnose?clinic_id=11111111-1111-1111-1111-111111111111');
const data = await response.json();

console.log('診断結果:', JSON.stringify(data, null, 2));

// 2. LINE Messaging APIを使ってユーザーにメニューを直接リンク
// まず、あなたのLINE User IDが必要です
// データベースから連携情報を取得

const linkagesResponse = await fetch('https://dmax-mu.vercel.app/api/line/get-linkages?clinic_id=11111111-1111-1111-1111-111111111111');

if (linkagesResponse.ok) {
  const linkages = await linkagesResponse.json();
  console.log('\n連携中のユーザー:', linkages);
}
