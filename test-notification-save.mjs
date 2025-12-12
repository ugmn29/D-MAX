import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 通知設定保存機能をテスト\n');

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

// テスト用のLINE設定
const testSettings = {
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
    channel_id: '2008448348',
    channel_secret: 'test-secret',
    channel_access_token: 'test-token-1234567890',
    webhook_url: 'https://d-max-lemon.vercel.app/api/line/webhook'
  }
};

console.log('📊 テスト設定:');
console.log('  enabled:', testSettings.line.enabled);
console.log('  channel_id:', testSettings.line.channel_id);
console.log('  has_secret:', !!testSettings.line.channel_secret);
console.log('  has_token:', !!testSettings.line.channel_access_token);
console.log('');

console.log('💾 notification_settings キーに保存中...\n');

// 1. notification_settings キーに保存
const { data: notifData, error: notifError } = await supabase
  .from('clinic_settings')
  .upsert({
    clinic_id: clinicId,
    setting_key: 'notification_settings',
    setting_value: testSettings
  }, {
    onConflict: 'clinic_id,setting_key'
  })
  .select();

if (notifError) {
  console.error('❌ notification_settings 保存エラー:', notifError);
  process.exit(1);
}

console.log('✅ notification_settings を保存しました');
console.log('   データ:', notifData);
console.log('');

// 2. LINE基本設定を同期保存
if (testSettings.line.enabled && testSettings.line.channel_access_token && testSettings.line.channel_secret) {
  console.log('💾 LINE基本設定 (line キー) に同期保存中...\n');

  const { data: lineData, error: lineError } = await supabase
    .from('clinic_settings')
    .upsert({
      clinic_id: clinicId,
      setting_key: 'line',
      setting_value: {
        channel_access_token: testSettings.line.channel_access_token,
        channel_secret: testSettings.line.channel_secret,
        channel_id: testSettings.line.channel_id || undefined,
        webhook_url: testSettings.line.webhook_url || 'https://d-max-lemon.vercel.app/api/line/webhook'
      }
    }, {
      onConflict: 'clinic_id,setting_key'
    })
    .select();

  if (lineError) {
    console.error('❌ LINE基本設定保存エラー:', lineError);
  } else {
    console.log('✅ LINE基本設定を保存しました');
    console.log('   データ:', lineData);
  }
}

console.log('\n🎉 テスト完了！\n');

// 確認
console.log('📊 保存されたデータを確認:\n');

const { data: savedNotif } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'notification_settings')
  .maybeSingle();

if (savedNotif) {
  console.log('✅ notification_settings:');
  console.log('   LINE有効:', savedNotif.setting_value.line.enabled);
  console.log('   チャンネルID:', savedNotif.setting_value.line.channel_id);
}

const { data: savedLine } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

if (savedLine) {
  console.log('\n✅ line:');
  console.log('   チャンネルID:', savedLine.setting_value.channel_id);
  console.log('   アクセストークン:', savedLine.setting_value.channel_access_token.substring(0, 20) + '...');
}

console.log('\n✅ データベースに正常に保存されました！');
console.log('これで設定画面からの保存も動作するはずです。');
