import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 リッチメニュー作成機能のテスト\n');

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

// LINE設定を確認
const { data: lineSettings, error: lineError } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

if (lineError) {
  console.error('❌ LINE設定取得エラー:', lineError);
  process.exit(1);
}

if (!lineSettings || !lineSettings.setting_value) {
  console.error('❌ LINE基本設定が見つかりません');
  console.log('   → 先に通知設定タブでLINE設定を保存してください');
  process.exit(1);
}

const line = lineSettings.setting_value;

if (!line.channel_access_token || !line.channel_secret) {
  console.error('❌ LINE Channel Access TokenまたはChannel Secretが未設定');
  console.log('   → 通知設定タブでLINE設定を保存してください');
  process.exit(1);
}

console.log('✅ LINE設定が存在します:');
console.log(`   Channel Access Token: ${line.channel_access_token.substring(0, 20)}...`);
console.log(`   Channel Secret: ****`);
console.log('');

// 実装されたAPIエンドポイントを確認
console.log('📋 実装されたAPIエンドポイントを確認:\n');

const endpoints = [
  '/app/api/line/create-rich-menu/route.ts',
  '/app/api/line/save-rich-menu-ids/route.ts',
];

import fs from 'fs';

for (const endpoint of endpoints) {
  const fullPath = `/Users/fukunagashindai/Downloads/D-MAX${endpoint}`;
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${endpoint}`);
  } else {
    console.log(`❌ ${endpoint} - ファイルが見つかりません`);
  }
}

console.log('');

// リッチメニューIDが既に保存されているか確認
const { data: richMenuSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

if (richMenuSettings?.setting_value) {
  const richMenu = richMenuSettings.setting_value;
  console.log('📋 既存のリッチメニューID:');
  console.log(`   連携済みメニューID: ${richMenu.line_registered_rich_menu_id || '未設定'}`);
  console.log(`   未連携メニューID: ${richMenu.line_unregistered_rich_menu_id || '未設定'}`);
} else {
  console.log('📋 リッチメニューIDは未設定です');
}

console.log('\n' + '='.repeat(60));
console.log('✅ 準備完了！\n');

console.log('次のステップ:');
console.log('1. ブラウザで http://localhost:3000/settings にアクセス');
console.log('2. 「通知」タブ → 「LINEリッチメニュー」タブに移動');
console.log('3. 「連携済みユーザー用」タブでリッチメニューを編集');
console.log('4. 「LINE APIに登録」ボタンをクリック');
console.log('5. リッチメニューIDが表示されれば成功');
console.log('6. 「未連携ユーザー用」タブでも同様に登録');
console.log('7. 患者連携を実行してリッチメニューが切り替わることを確認');
console.log('='.repeat(60));
