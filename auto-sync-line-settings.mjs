import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 LINE設定を自動同期\n');

// clinic_idを取得
const { data: clinics } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

if (!clinics || clinics.length === 0) {
  console.error('❌ クリニック情報が見つかりません');
  process.exit(1);
}

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name} (${clinicId})\n`);

// notificationConnection設定を取得
const { data: notifSettings, error: notifError } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'notificationConnection')
  .maybeSingle();

if (notifError) {
  console.error('❌ notificationConnection取得エラー:', notifError);
  process.exit(1);
}

if (!notifSettings || !notifSettings.setting_value?.line) {
  console.log('❌ notificationConnection にLINE設定が見つかりません');
  console.log('');
  console.log('💡 通知タブ（接続設定）でLINE設定を入力して保存してください:');
  console.log('   1. https://dmax-mu.vercel.app/settings にアクセス');
  console.log('   2. 「通知」タブを開く');
  console.log('   3. 「LINE公式アカウント設定」セクションで以下を入力:');
  console.log('      - チャンネルID');
  console.log('      - チャンネルシークレット');
  console.log('      - アクセストークン');
  console.log('   4. 「保存」ボタンをクリック');
  console.log('   5. 再度このスクリプトを実行');
  process.exit(0);
}

const line = notifSettings.setting_value.line;

if (!line.enabled) {
  console.log('⚠️ LINE通知が無効になっています');
  console.log('通知タブでLINE通知を有効にしてください');
  process.exit(0);
}

if (!line.accessToken || !line.channelSecret) {
  console.log('❌ アクセストークンまたはチャンネルシークレットが未設定です');
  console.log('通知タブで以下を入力してください:');
  console.log('  - チャンネルシークレット');
  console.log('  - アクセストークン');
  process.exit(1);
}

console.log('✅ notificationConnection からLINE設定を取得しました\n');
console.log('📊 取得した設定:');
console.log(`  チャンネルID: ${line.channelId || '未設定'}`);
console.log(`  チャンネルシークレット: ****`);
console.log(`  アクセストークン: ${line.accessToken.substring(0, 20)}...`);
console.log(`  Webhook URL: ${line.webhookUrl || 'https://dmax-mu.vercel.app/api/line/webhook'}`);

console.log('\n💾 データベースに保存中...\n');

// LINE基本設定を保存（getLineSettings関数が読み取る形式）
const { error: lineError } = await supabase
  .from('clinic_settings')
  .upsert({
    clinic_id: clinicId,
    setting_key: 'line',
    setting_value: {
      channel_access_token: line.accessToken,
      channel_secret: line.channelSecret,
      channel_id: line.channelId || undefined,
      webhook_url: line.webhookUrl || 'https://dmax-mu.vercel.app/api/line/webhook'
    }
  }, {
    onConflict: 'clinic_id,setting_key'
  });

if (lineError) {
  console.error('❌ LINE設定保存エラー:', lineError);
  process.exit(1);
}

console.log('✅ LINE基本設定をデータベースに保存しました');

console.log('\n🎉 設定同期完了！\n');

// 確認
const { data: lineSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

console.log('📊 データベースに保存されたLINE設定:');
const maskedSettings = {
  ...lineSettings?.setting_value,
  channel_access_token: lineSettings?.setting_value?.channel_access_token
    ? `${lineSettings.setting_value.channel_access_token.substring(0, 20)}...`
    : '未設定',
  channel_secret: lineSettings?.setting_value?.channel_secret
    ? '****'
    : '未設定'
};
console.log(JSON.stringify(maskedSettings, null, 2));

console.log('\n✅ これでLINE連携時にリッチメニューが自動切り替わります！');
console.log('\n📝 次のステップ:');
console.log('1. LINEアプリで再度患者連携を試す');
console.log('2. Vercelログで「✅ リッチメニュー切り替え成功」が出力されることを確認');
console.log('3. LINEアプリのトーク画面下部でリッチメニューが切り替わることを確認');
