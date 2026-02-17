import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 リッチメニュー切り替え問題を診断\n');
console.log('=' .repeat(60));

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
console.log(`\n🏥 クリニック: ${clinics[0].name}`);
console.log(`   ID: ${clinicId}\n`);
console.log('=' .repeat(60));

// 診断項目
let issues = [];
let warnings = [];

// 1. LINE基本設定をチェック
console.log('\n📋 チェック1: LINE基本設定 (setting_key="line")');
const { data: lineSettings, error: lineError } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

if (lineError) {
  console.log(`   ❌ エラー: ${lineError.message}`);
  issues.push('LINE基本設定の取得に失敗');
} else if (!lineSettings || !lineSettings.setting_value) {
  console.log('   ❌ LINE基本設定が見つかりません');
  issues.push('LINE基本設定が未登録');
} else {
  const line = lineSettings.setting_value;
  console.log('   ✅ LINE基本設定が存在します');

  if (!line.channel_access_token) {
    console.log('   ❌ channel_access_tokenが設定されていません');
    issues.push('Channel Access Tokenが未設定');
  } else {
    console.log(`   ✅ channel_access_token: ${line.channel_access_token.substring(0, 20)}...`);
  }

  if (!line.channel_secret) {
    console.log('   ❌ channel_secretが設定されていません');
    issues.push('Channel Secretが未設定');
  } else {
    console.log('   ✅ channel_secret: ****');
  }

  if (line.channel_id) {
    console.log(`   ✅ channel_id: ${line.channel_id}`);
  } else {
    console.log('   ⚠️  channel_idが未設定（オプション）');
    warnings.push('Channel IDが未設定（任意項目）');
  }

  if (line.webhook_url) {
    console.log(`   ✅ webhook_url: ${line.webhook_url}`);
  } else {
    console.log('   ⚠️  webhook_urlが未設定');
    warnings.push('Webhook URLが未設定');
  }
}

// 2. リッチメニュー設定をチェック
console.log('\n📋 チェック2: リッチメニュー設定 (setting_key="line_rich_menu")');
const { data: richMenuSettings, error: richMenuError } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

if (richMenuError) {
  console.log(`   ❌ エラー: ${richMenuError.message}`);
  issues.push('リッチメニュー設定の取得に失敗');
} else if (!richMenuSettings || !richMenuSettings.setting_value) {
  console.log('   ⚠️  リッチメニュー設定が見つかりません');
  warnings.push('リッチメニューIDが未設定（リッチメニューは切り替わりません）');
} else {
  const richMenu = richMenuSettings.setting_value;
  console.log('   ✅ リッチメニュー設定が存在します');

  if (richMenu.line_registered_rich_menu_id) {
    console.log(`   ✅ 連携済みメニューID: ${richMenu.line_registered_rich_menu_id}`);
  } else {
    console.log('   ⚠️  連携済みメニューIDが未設定');
    warnings.push('連携済みリッチメニューIDが未設定');
  }

  if (richMenu.line_unregistered_rich_menu_id) {
    console.log(`   ✅ 未連携メニューID: ${richMenu.line_unregistered_rich_menu_id}`);
  } else {
    console.log('   ⚠️  未連携メニューIDが未設定');
    warnings.push('未連携リッチメニューIDが未設定');
  }
}

// 3. notificationConnection設定をチェック
console.log('\n📋 チェック3: 通知設定 (setting_key="notificationConnection")');
const { data: notifSettings, error: notifError } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'notificationConnection')
  .maybeSingle();

if (notifError) {
  console.log(`   ❌ エラー: ${notifError.message}`);
  warnings.push('通知設定の取得に失敗');
} else if (!notifSettings || !notifSettings.setting_value) {
  console.log('   ⚠️  通知設定が見つかりません');
  warnings.push('通知設定が未保存（設定画面で表示されません）');
} else {
  console.log('   ✅ 通知設定が存在します');

  if (notifSettings.setting_value.line) {
    const line = notifSettings.setting_value.line;

    if (line.enabled) {
      console.log('   ✅ LINE通知が有効');
    } else {
      console.log('   ⚠️  LINE通知が無効');
      warnings.push('通知設定でLINE通知が無効');
    }

    if (line.accessToken) {
      console.log(`   ✅ accessToken: ${line.accessToken.substring(0, 20)}...`);
    } else {
      console.log('   ❌ accessTokenが未設定');
    }

    if (line.channelSecret) {
      console.log('   ✅ channelSecret: ****');
    } else {
      console.log('   ❌ channelSecretが未設定');
    }
  } else {
    console.log('   ⚠️  LINE設定がありません');
  }
}

// 4. 患者連携状況をチェック
console.log('\n📋 チェック4: LINE患者連携');
const { data: linkages, error: linkagesError } = await supabase
  .from('line_patient_linkages')
  .select('id, line_user_id, patient_id, created_at')
  .eq('clinic_id', clinicId)
  .order('created_at', { ascending: false })
  .limit(5);

if (linkagesError) {
  console.log(`   ❌ エラー: ${linkagesError.message}`);
} else if (!linkages || linkages.length === 0) {
  console.log('   ℹ️  連携済みの患者がいません');
} else {
  console.log(`   ✅ ${linkages.length}件の連携が見つかりました（最新5件）:`);
  linkages.forEach((l, i) => {
    console.log(`      ${i + 1}. LINE User: ${l.line_user_id.substring(0, 10)}... | 患者ID: ${l.patient_id} | ${new Date(l.created_at).toLocaleString('ja-JP')}`);
  });
}

// サマリー
console.log('\n' + '='.repeat(60));
console.log('📊 診断結果サマリー\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ すべてのチェックに合格しました！');
  console.log('   リッチメニュー切り替え機能は正常に動作するはずです。\n');
  console.log('💡 それでもリッチメニューが切り替わらない場合:');
  console.log('   1. 患者連携をもう一度試す');
  console.log('   2. LINEアプリを再起動');
  console.log('   3. Vercelログで「リッチメニュー切り替え」関連のログを確認');
} else {
  if (issues.length > 0) {
    console.log('❌ 重大な問題が見つかりました:\n');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  警告:\n');
    warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
    console.log('');
  }

  console.log('🔧 修正方法:\n');

  if (issues.includes('LINE基本設定が未登録') || issues.includes('Channel Access Tokenが未設定') || issues.includes('Channel Secretが未設定')) {
    console.log('【重要】LINE基本設定が不足しています:');
    console.log('');
    console.log('方法1: 通知タブから保存（推奨）');
    console.log('  1. https://shikabot-mu.vercel.app/settings にアクセス');
    console.log('  2. 「通知」タブを開く');
    console.log('  3. 「LINE公式アカウント設定」セクションで:');
    console.log('     - ☑ LINE通知を有効にする');
    console.log('     - チャンネルID（オプション）');
    console.log('     - チャンネルシークレット（必須）');
    console.log('     - アクセストークン（必須）');
    console.log('  4. 「保存」ボタンをクリック');
    console.log('  5. ブラウザのコンソールで「保存成功:」を確認');
    console.log('  6. 再度このスクリプトを実行して確認');
    console.log('');
    console.log('方法2: スクリプトで直接登録');
    console.log('  source .env.local && node manual-insert-line-settings.mjs "<チャンネルシークレット>" "<アクセストークン>" "[チャンネルID]"');
    console.log('');
  }

  if (warnings.includes('リッチメニューIDが未設定（リッチメニューは切り替わりません）')) {
    console.log('【任意】リッチメニューIDを設定:');
    console.log('  1. LINE Developers Consoleでリッチメニューを作成');
    console.log('  2. 連携済み・未連携用の2つのリッチメニューIDを取得');
    console.log('  3. 以下のスクリプトで設定:');
    console.log('     source .env.local && node setup-line-rich-menu-ids.mjs "<連携済みID>" "<未連携ID>"');
    console.log('');
  }
}

console.log('='.repeat(60));
