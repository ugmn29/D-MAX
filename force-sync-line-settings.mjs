import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 LINE設定を強制的に同期\n');

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

// まず既存のnotificationConnection設定を確認
console.log('📊 既存のnotificationConnection設定を確認中...\n');

const { data: existingNotif, error: notifError } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'notificationConnection')
  .maybeSingle();

if (notifError) {
  console.error('❌ notificationConnection取得エラー:', notifError);
}

if (existingNotif?.setting_value) {
  console.log('✅ 既存のnotificationConnection設定が見つかりました:');
  console.log(JSON.stringify(existingNotif.setting_value, null, 2));

  if (existingNotif.setting_value.line) {
    const line = existingNotif.setting_value.line;

    if (line.enabled && line.accessToken && line.channelSecret) {
      console.log('\n✅ LINE設定が有効で、必須項目が揃っています');
      console.log('💾 LINE基本設定をデータベースに保存中...\n');

      const { error: lineError } = await supabase
        .from('clinic_settings')
        .upsert({
          clinic_id: clinicId,
          setting_key: 'line',
          setting_value: {
            channel_access_token: line.accessToken,
            channel_secret: line.channelSecret,
            channel_id: line.channelId || undefined,
            webhook_url: line.webhookUrl || 'https://shikabot-mu.vercel.app/api/line/webhook'
          }
        }, {
          onConflict: 'clinic_id,setting_key'
        });

      if (lineError) {
        console.error('❌ LINE設定保存エラー:', lineError);
        process.exit(1);
      }

      console.log('✅ LINE設定を同期しました\n');

      // 確認
      const { data: savedLine } = await supabase
        .from('clinic_settings')
        .select('setting_value')
        .eq('clinic_id', clinicId)
        .eq('setting_key', 'line')
        .maybeSingle();

      console.log('📊 保存されたLINE設定:');
      const masked = {
        ...savedLine?.setting_value,
        channel_access_token: savedLine?.setting_value?.channel_access_token
          ? `${savedLine.setting_value.channel_access_token.substring(0, 20)}...`
          : '未設定',
        channel_secret: '****'
      };
      console.log(JSON.stringify(masked, null, 2));

      console.log('\n🎉 同期完了！これでリッチメニュー切り替えが動作します。');
    } else {
      console.log('\n⚠️ LINE設定が無効か、必須項目が不足しています:');
      console.log(`  enabled: ${line.enabled}`);
      console.log(`  accessToken: ${line.accessToken ? 'あり' : 'なし'}`);
      console.log(`  channelSecret: ${line.channelSecret ? 'あり' : 'なし'}`);
      console.log('\n通知タブでLINE設定を入力して保存してください。');
    }
  } else {
    console.log('\n⚠️ notificationConnection設定にLINE情報がありません');
    console.log('通知タブでLINE設定を入力して保存してください。');
  }
} else {
  console.log('❌ notificationConnection設定が見つかりません\n');
  console.log('💡 通知タブでLINE設定を入力して保存してください:');
  console.log('   1. https://shikabot-mu.vercel.app/settings にアクセス');
  console.log('   2. 「通知」タブを開く');
  console.log('   3. 「LINE公式アカウント設定」で以下を入力:');
  console.log('      - LINE通知を有効にする（チェック）');
  console.log('      - チャンネルID');
  console.log('      - チャンネルシークレット');
  console.log('      - アクセストークン');
  console.log('   4. 「保存」ボタンをクリック');
  console.log('   5. 再度このスクリプトを実行');
}
