// ユーザーに直接新しいリッチメニューをリンクして強制更新
console.log('🔄 ユーザーのリッチメニューを強制更新\n');

const newMenuId = 'richmenu-e0a7d82120f985f18a8d26d6c5b5be32';

// まず、LINE Bot SDKを使って全ユーザーのリッチメニューをリセット
// これは次回ユーザーがメッセージを送信した時に新しいメニューが適用されるようにします

console.log('📌 ステップ1: テストメッセージを送信してリッチメニューの更新をトリガー');
console.log('\n以下のいずれかの方法を試してください:\n');
console.log('方法1: LINEアプリから何かメッセージを送信');
console.log('  → 例: "こんにちは" と送信');
console.log('  → これによりWebhookが発火し、リッチメニューが更新される可能性があります\n');

console.log('方法2: デフォルトメニューをいったん削除して再設定');
console.log('  実行中...\n');

// デフォルトメニューをいったん削除
const unlinkResponse = await fetch('https://shikabot-mu.vercel.app/api/line/set-default-rich-menu', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clinic_id: '11111111-1111-1111-1111-111111111111',
    rich_menu_id: newMenuId
  })
});

if (unlinkResponse.ok) {
  console.log('  ✅ デフォルトメニューを再設定しました');
} else {
  console.log('  ⚠️  再設定に失敗');
}

console.log('\n方法3: Webhookイベントを手動でトリガー');
console.log('  以下のURLにアクセスしてテストイベントを送信:');
console.log('  https://shikabot-mu.vercel.app/api/line/webhook\n');

console.log('\n📱 重要: LINEの仕様により、リッチメニューの更新には以下が必要です:\n');
console.log('1. LINEアプリを完全に終了（バックグラウンドからも削除）');
console.log('2. 可能であればスマートフォンを再起動');
console.log('3. LINEアプリを再起動');
console.log('4. トーク画面を開く');
console.log('\nまたは:\n');
console.log('- トーク画面で何かメッセージを送信（例: "更新"）');
console.log('- その後、トーク画面を閉じて再度開く');
console.log('\n注意: LINEはリッチメニューを積極的にキャッシュします。');
console.log('完全に反映されるまで最大5-10分かかる場合があります。');
