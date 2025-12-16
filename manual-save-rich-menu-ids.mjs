import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('💾 リッチメニューIDを手動で保存\n');

// ブラウザログから取得したリッチメニューID
const REGISTERED_MENU_ID = 'richmenu-69df26e74d82e19955455ddaf85951de';
const UNREGISTERED_MENU_ID = 'richmenu-90cf10257da1df4286f1d798d62a50dd';

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

console.log('📊 保存するリッチメニューID:');
console.log(`   連携済み: ${REGISTERED_MENU_ID}`);
console.log(`   未連携: ${UNREGISTERED_MENU_ID}`);
console.log('');

// 既存の設定を確認
const { data: existingSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

if (existingSettings) {
  console.log('📋 既存の設定:', existingSettings.setting_value);
} else {
  console.log('📋 既存の設定: なし');
}
console.log('');

// 保存
const { data, error } = await supabase
  .from('clinic_settings')
  .upsert({
    clinic_id: clinicId,
    setting_key: 'line_rich_menu',
    setting_value: {
      line_registered_rich_menu_id: REGISTERED_MENU_ID,
      line_unregistered_rich_menu_id: UNREGISTERED_MENU_ID
    }
  }, {
    onConflict: 'clinic_id,setting_key'
  })
  .select();

if (error) {
  console.error('❌ 保存エラー:', error);
  process.exit(1);
}

console.log('✅ リッチメニューIDを保存しました');
console.log('');

// 確認
const { data: savedSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

if (savedSettings?.setting_value) {
  console.log('📋 保存された設定:');
  console.log(`   連携済み: ${savedSettings.setting_value.line_registered_rich_menu_id}`);
  console.log(`   未連携: ${savedSettings.setting_value.line_unregistered_rich_menu_id}`);
  console.log('');
  console.log('🎉 保存完了！');
  console.log('');
  console.log('次のステップ:');
  console.log('1. 本番のLINE Channel Access Tokenを設定ページで保存');
  console.log('2. 患者連携を実行');
  console.log('3. リッチメニューが切り替わることを確認');
} else {
  console.error('❌ 保存確認に失敗');
}
