import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 LINE設定を環境変数から自動設定\n');

// .env.localから読み取る
const channelSecret = process.env.LINE_CHANNEL_SECRET;
const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelId = process.env.LINE_CHANNEL_ID || '';
const registeredMenuId = process.env.LINE_REGISTERED_RICH_MENU_ID || '';
const unregisteredMenuId = process.env.LINE_UNREGISTERED_RICH_MENU_ID || '';

console.log('📊 環境変数の確認:');
console.log(`  LINE_CHANNEL_SECRET: ${channelSecret ? '設定済み' : '未設定'}`);
console.log(`  LINE_CHANNEL_ACCESS_TOKEN: ${accessToken ? '設定済み' : '未設定'}`);
console.log(`  LINE_CHANNEL_ID: ${channelId || '未設定'}`);
console.log(`  LINE_REGISTERED_RICH_MENU_ID: ${registeredMenuId || '未設定'}`);
console.log(`  LINE_UNREGISTERED_RICH_MENU_ID: ${unregisteredMenuId || '未設定'}`);
console.log('');

if (!channelSecret || !accessToken) {
  console.error('❌ LINE_CHANNEL_SECRETとLINE_CHANNEL_ACCESS_TOKENは必須です');
  console.log('\n.env.localファイルに以下を追加してください:');
  console.log('');
  console.log('LINE_CHANNEL_SECRET="your-channel-secret"');
  console.log('LINE_CHANNEL_ACCESS_TOKEN="your-access-token"');
  console.log('LINE_CHANNEL_ID="your-channel-id" # オプション');
  console.log('LINE_REGISTERED_RICH_MENU_ID="richmenu-xxx" # オプション');
  console.log('LINE_UNREGISTERED_RICH_MENU_ID="richmenu-yyy" # オプション');
  process.exit(1);
}

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

console.log('💾 データベースに保存中...\n');

// 1. LINE基本設定を保存
const { error: lineError } = await supabase
  .from('clinic_settings')
  .upsert({
    clinic_id: clinicId,
    setting_key: 'line',
    setting_value: {
      channel_access_token: accessToken,
      channel_secret: channelSecret,
      channel_id: channelId || undefined,
      webhook_url: 'https://shikabot-mu.vercel.app/api/line/webhook'
    }
  }, {
    onConflict: 'clinic_id,setting_key'
  });

if (lineError) {
  console.error('❌ LINE基本設定保存エラー:', lineError);
  process.exit(1);
}

console.log('✅ LINE基本設定を保存しました');

// 2. リッチメニュー設定を保存（IDが指定されている場合）
if (registeredMenuId || unregisteredMenuId) {
  const { error: richMenuError } = await supabase
    .from('clinic_settings')
    .upsert({
      clinic_id: clinicId,
      setting_key: 'line_rich_menu',
      setting_value: {
        line_registered_rich_menu_id: registeredMenuId || undefined,
        line_unregistered_rich_menu_id: unregisteredMenuId || undefined
      }
    }, {
      onConflict: 'clinic_id,setting_key'
    });

  if (richMenuError) {
    console.error('❌ リッチメニュー設定保存エラー:', richMenuError);
  } else {
    console.log('✅ リッチメニュー設定を保存しました');
  }
}

// 3. notification_settings設定も保存（設定画面で表示するため）
const { error: notifError } = await supabase
  .from('clinic_settings')
  .upsert({
    clinic_id: clinicId,
    setting_key: 'notification_settings',
    setting_value: {
      email: {
        enabled: false,
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        from_address: '',
        from_name: ''
      },
      sms: {
        enabled: false,
        provider: 'twilio',
        api_key: '',
        api_secret: '',
        sender_number: ''
      },
      line: {
        enabled: true,
        channel_id: channelId || '',
        channel_secret: channelSecret,
        channel_access_token: accessToken,
        webhook_url: 'https://shikabot-mu.vercel.app/api/line/webhook'
      }
    }
  }, {
    onConflict: 'clinic_id,setting_key'
  });

if (notifError) {
  console.error('⚠️  通知設定保存エラー:', notifError);
} else {
  console.log('✅ 通知設定を保存しました');
}

console.log('\n🎉 設定完了！\n');

// 確認
const { data: savedLine } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

if (savedLine?.setting_value) {
  console.log('📊 保存されたLINE設定:');
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

console.log('\n✅ これでLINE連携とリッチメニュー切り替えが動作します！');
console.log('\n📝 次のステップ:');
console.log('1. LINEアプリで患者連携を実行');
console.log('2. 連携成功後、リッチメニューが未連携→連携済みに切り替わることを確認');
console.log('3. 患者詳細ページで連携解除ボタンをクリック');
console.log('4. リッチメニューが連携済み→未連携に戻ることを確認');
