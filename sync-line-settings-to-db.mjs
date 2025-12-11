import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

console.log('🔧 LINE設定を通知タブからデータベースに同期\n');

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

console.log('通知設定タブ（接続設定）に入力したLINE設定を確認します。');
console.log('以下の情報を入力してください:\n');

const channelId = await question('チャンネルID: ');
const channelSecret = await question('チャンネルシークレット: ');
const accessToken = await question('アクセストークン: ');

rl.close();

if (!accessToken || !channelSecret) {
  console.error('\n❌ Channel Access Token と Channel Secret は必須です');
  process.exit(1);
}

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
      webhook_url: `https://d-max-lemon.vercel.app/api/line/webhook`
    }
  }, {
    onConflict: 'clinic_id,setting_key'
  });

if (lineError) {
  console.error('❌ LINE設定保存エラー:', lineError);
  process.exit(1);
}

console.log('✅ LINE基本設定をデータベースに保存しました');

// notificationConnectionキーにも保存（設定画面で表示するため）
const { error: notifError } = await supabase
  .from('clinic_settings')
  .upsert({
    clinic_id: clinicId,
    setting_key: 'notificationConnection',
    setting_value: {
      email: {
        enabled: false,
        smtpServer: '',
        smtpPort: 587,
        username: '',
        password: '',
        fromEmail: ''
      },
      sms: {
        enabled: false,
        provider: '',
        apiKey: '',
        fromNumber: ''
      },
      line: {
        enabled: true,
        channelId: channelId || '',
        channelSecret: channelSecret,
        accessToken: accessToken,
        webhookUrl: `https://d-max-lemon.vercel.app/api/line/webhook`
      }
    }
  }, {
    onConflict: 'clinic_id,setting_key'
  });

if (notifError) {
  console.error('⚠️ notificationConnection保存エラー:', notifError);
  console.log('（LINE基本設定は保存済みなので、リッチメニュー切り替えは動作します）');
}

console.log('✅ 通知設定も保存しました');

console.log('\n📋 リッチメニューIDについて:');
console.log('LINE Developers ConsoleでリッチメニューIDを取得済みの場合、以下のコマンドで登録できます:');
console.log('');
console.log('source .env.local && node setup-line-settings.mjs');
console.log('');
console.log('リッチメニューIDが未設定でも、連携は動作します（リッチメニュー切り替えのみスキップされます）');

console.log('\n🎉 設定完了！\n');

// 確認
const { data: lineSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

console.log('📊 保存されたLINE設定:');
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
