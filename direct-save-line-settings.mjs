import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 LINE設定を直接データベースに保存\n');

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

// コマンドライン引数から取得
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('使用方法:');
  console.log('node direct-save-line-settings.mjs <channelSecret> <accessToken> [channelId]');
  console.log('');
  console.log('例:');
  console.log('node direct-save-line-settings.mjs "your-channel-secret" "your-access-token" "1234567890"');
  console.log('');
  console.log('必須:');
  console.log('  channelSecret  : チャンネルシークレット');
  console.log('  accessToken    : チャンネルアクセストークン（長期）');
  console.log('');
  console.log('オプション:');
  console.log('  channelId      : チャンネルID');
  process.exit(0);
}

const channelSecret = args[0];
const accessToken = args[1];
const channelId = args[2] || '';

if (!channelSecret || !accessToken) {
  console.error('❌ チャンネルシークレットとアクセストークンは必須です');
  process.exit(1);
}

console.log('📊 入力された設定:');
console.log(`  チャンネルID: ${channelId || '未設定'}`);
console.log(`  チャンネルシークレット: ****`);
console.log(`  アクセストークン: ${accessToken.substring(0, 20)}...`);

console.log('\n💾 データベースに保存中...\n');

// LINE基本設定を保存（getLineSettings関数が読み取る形式）
const { error: lineError } = await supabase
  .from('clinic_settings')
  .upsert({
    clinic_id: clinicId,
    setting_key: 'line',
    setting_value: {
      channel_access_token: accessToken,
      channel_secret: channelSecret,
      channel_id: channelId || undefined,
      webhook_url: 'https://dmax-mu.vercel.app/api/line/webhook'
    }
  }, {
    onConflict: 'clinic_id,setting_key'
  });

if (lineError) {
  console.error('❌ LINE設定保存エラー:', lineError);
  process.exit(1);
}

console.log('✅ LINE基本設定をデータベースに保存しました');

console.log('\n🎉 設定保存完了！\n');

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
