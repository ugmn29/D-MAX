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

console.log('🔧 LINE設定セットアップスクリプト\n');

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

console.log('以下の情報を入力してください:\n');

const channelAccessToken = await question('Channel Access Token: ');
const channelSecret = await question('Channel Secret: ');
const registeredRichMenuId = await question('連携済み用リッチメニューID (オプション): ');
const unregisteredRichMenuId = await question('未連携用リッチメニューID (オプション): ');

rl.close();

console.log('\n💾 データベースに保存中...\n');

// LINE基本設定を保存
const { error: lineError } = await supabase
  .from('clinic_settings')
  .upsert({
    clinic_id: clinicId,
    setting_key: 'line',
    setting_value: {
      channel_access_token: channelAccessToken,
      channel_secret: channelSecret,
      webhook_url: `https://d-max-lemon.vercel.app/api/line/webhook`
    }
  }, {
    onConflict: 'clinic_id,setting_key'
  });

if (lineError) {
  console.error('❌ LINE設定保存エラー:', lineError);
  process.exit(1);
}

console.log('✅ LINE基本設定を保存しました');

// リッチメニューIDを保存（入力された場合のみ）
if (registeredRichMenuId || unregisteredRichMenuId) {
  const { error: richMenuError } = await supabase
    .from('clinic_settings')
    .upsert({
      clinic_id: clinicId,
      setting_key: 'line_rich_menu',
      setting_value: {
        line_registered_rich_menu_id: registeredRichMenuId || null,
        line_unregistered_rich_menu_id: unregisteredRichMenuId || null
      }
    }, {
      onConflict: 'clinic_id,setting_key'
    });

  if (richMenuError) {
    console.error('❌ リッチメニュー設定保存エラー:', richMenuError);
    process.exit(1);
  }

  console.log('✅ リッチメニュー設定を保存しました');
}

console.log('\n🎉 設定完了！\n');

// 確認
const { data: lineSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

const { data: richMenuSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

console.log('📊 保存された設定:\n');
console.log('LINE基本設定:');
console.log(JSON.stringify(lineSettings?.setting_value, null, 2));
console.log('\nリッチメニュー設定:');
console.log(JSON.stringify(richMenuSettings?.setting_value || {}, null, 2));
