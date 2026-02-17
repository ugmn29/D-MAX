import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 /api/line/save-rich-menu-ids APIをテスト\n');

// clinic_idを取得
const { data: clinics } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name}\n`);

// テスト用のリッチメニューID
const testRegisteredId = 'richmenu-test-registered-' + Date.now();
const testUnregisteredId = 'richmenu-test-unregistered-' + Date.now();

console.log('📊 テストデータ:');
console.log(`   clinic_id: ${clinicId}`);
console.log(`   registered_menu_id: ${testRegisteredId}`);
console.log(`   unregistered_menu_id: ${testUnregisteredId}`);
console.log('');

// 本番環境のAPIを呼び出し
const apiUrl = 'https://shikabot-mu.vercel.app/api/line/save-rich-menu-ids';

console.log(`📡 APIを呼び出し中: ${apiUrl}\n`);

try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clinic_id: clinicId,
      registered_menu_id: testRegisteredId,
      unregistered_menu_id: testUnregisteredId
    })
  });

  console.log(`📡 レスポンスステータス: ${response.status}`);

  const result = await response.json();
  console.log('📡 レスポンス:', result);
  console.log('');

  if (response.ok) {
    console.log('✅ API呼び出し成功');
    console.log('');

    // データベースを確認
    console.log('📋 データベースを確認中...\n');

    const { data: savedSettings } = await supabase
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinicId)
      .eq('setting_key', 'line_rich_menu')
      .maybeSingle();

    if (savedSettings?.setting_value) {
      console.log('✅ データベースに保存されています:');
      console.log(`   連携済み: ${savedSettings.setting_value.line_registered_rich_menu_id}`);
      console.log(`   未連携: ${savedSettings.setting_value.line_unregistered_rich_menu_id}`);

      if (savedSettings.setting_value.line_registered_rich_menu_id === testRegisteredId &&
          savedSettings.setting_value.line_unregistered_rich_menu_id === testUnregisteredId) {
        console.log('');
        console.log('🎉 テスト成功！APIとDBの保存が正常に動作しています');
      } else {
        console.log('');
        console.log('⚠️  保存されたIDがテストデータと一致しません');
      }
    } else {
      console.log('❌ データベースに保存されていません');
      console.log('   APIは成功を返したが、DBには保存されていない');
    }
  } else {
    console.log('❌ API呼び出し失敗');
    console.log('   エラー:', result.error || result);
  }
} catch (error) {
  console.error('❌ テスト実行エラー:', error);
  console.error('   ', error.message);
}
