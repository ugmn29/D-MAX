import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '設定済み' : '未設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 LINE設定を手動で登録\n');
console.log('このスクリプトは、通知タブで入力したLINE設定情報を');
console.log('データベースに直接保存します。\n');

// clinic_idを取得
const { data: clinics, error: clinicsError } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

if (clinicsError) {
  console.error('❌ クリニック取得エラー:', clinicsError);
  process.exit(1);
}

if (!clinics || clinics.length === 0) {
  console.error('❌ クリニック情報が見つかりません');
  process.exit(1);
}

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name} (${clinicId})\n`);

// コマンドライン引数から取得
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('📝 使用方法:');
  console.log('node manual-insert-line-settings.mjs <channelSecret> <accessToken> [channelId]\n');
  console.log('例:');
  console.log('node manual-insert-line-settings.mjs "abc123secret" "eyJhbGc..." "2008448369"\n');
  console.log('必須パラメータ:');
  console.log('  channelSecret  : LINE Developers ConsoleのBasic settings > Channel secret');
  console.log('  accessToken    : LINE Developers ConsoleのMessaging API > Channel access token (long-lived)\n');
  console.log('オプション:');
  console.log('  channelId      : LINE Developers ConsoleのBasic settings > Channel ID\n');
  console.log('ヒント:');
  console.log('  これらの値は、通知タブの「LINE公式アカウント設定」で入力したものと同じです。');
  console.log('  設定画面で入力した値をここに貼り付けてください。');
  process.exit(0);
}

const channelSecret = args[0];
const accessToken = args[1];
const channelId = args[2] || '';

if (!channelSecret || !accessToken) {
  console.error('❌ channelSecretとaccessTokenは必須です');
  console.error('\n使用例:');
  console.error('node manual-insert-line-settings.mjs "your-secret" "your-token" "your-channel-id"');
  process.exit(1);
}

console.log('📊 登録する設定:');
console.log(`  チャンネルID: ${channelId || '未指定'}`);
console.log(`  チャンネルシークレット: ${channelSecret.substring(0, 10)}...`);
console.log(`  アクセストークン: ${accessToken.substring(0, 20)}...`);
console.log('');

// 1. LINE基本設定を保存（getLineSettings関数が読み取る形式）
console.log('💾 LINE基本設定を保存中...');

const { data: lineData, error: lineError } = await supabase
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
  })
  .select();

if (lineError) {
  console.error('❌ LINE基本設定保存エラー:', lineError);
  process.exit(1);
}

console.log('✅ LINE基本設定を保存しました');

// 2. notificationConnection設定も保存（設定画面で表示するため）
console.log('💾 通知設定を保存中...');

const { data: notifData, error: notifError } = await supabase
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
        webhookUrl: 'https://dmax-mu.vercel.app/api/line/webhook'
      }
    }
  }, {
    onConflict: 'clinic_id,setting_key'
  })
  .select();

if (notifError) {
  console.error('❌ 通知設定保存エラー:', notifError);
  console.log('（LINE基本設定は保存済みなので、リッチメニュー切り替えは動作します）');
} else {
  console.log('✅ 通知設定を保存しました');
}

console.log('\n🎉 設定保存完了！\n');

// 確認
console.log('📊 保存された設定を確認:');

const { data: savedLine } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

if (savedLine?.setting_value) {
  console.log('\n✅ LINE基本設定:');
  const masked = {
    channel_id: savedLine.setting_value.channel_id || '未設定',
    channel_secret: '****',
    channel_access_token: savedLine.setting_value.channel_access_token
      ? `${savedLine.setting_value.channel_access_token.substring(0, 20)}...`
      : '未設定',
    webhook_url: savedLine.setting_value.webhook_url
  };
  console.log(JSON.stringify(masked, null, 2));
}

console.log('\n✅ これでLINE連携時にリッチメニューが自動切り替わります！');
console.log('\n📝 次のステップ:');
console.log('1. LINEアプリで患者連携を試す');
console.log('2. ブラウザの開発者ツールで「✅ リッチメニュー切り替え成功」を確認');
console.log('3. LINEアプリのトーク画面下部でリッチメニューが6ボタンに切り替わることを確認');
console.log('\n💡 リッチメニューIDの設定:');
console.log('リッチメニューIDを設定するには、以下のスクリプトを使用してください:');
console.log('node setup-line-rich-menu-ids.mjs <registeredMenuId> <unregisteredMenuId>');
