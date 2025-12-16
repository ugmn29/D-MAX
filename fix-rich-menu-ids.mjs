import { createClient } from '@supabase/supabase-js';

// 本番環境のSupabase設定
const PROD_URL = 'https://obdfmwpdkwraqqqyjgwu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDk3NTkzMCwiZXhwIjoyMDQ2NTUxOTMwfQ.AuBYte-x23H2dKxZC7qK6aZxmJpTsvVXAo3hYsWTW5Y';

const supabase = createClient(PROD_URL, SERVICE_ROLE_KEY);

console.log('🔧 リッチメニューIDを修正します\n');

const clinicId = '11111111-1111-1111-1111-111111111111';

// 現在の設定を確認
const { data: currentSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

console.log('【現在の設定】');
console.log('   連携済み用ID:', currentSettings?.setting_value?.line_registered_rich_menu_id);
console.log('   未連携用ID:', currentSettings?.setting_value?.line_unregistered_rich_menu_id);
console.log('');

// APIで確認した正しい割り当て:
// - richmenu-cffbb7fc8aa864967306f4d280206e22 は "Unregistered" (3ボタン) → 未連携用
// - richmenu-2e269bfb465d128c13b22f8be77ec818 は「未連携ユーザー用」(3ボタン) → 未連携用

console.log('⚠️  問題: 両方とも未連携用メニューです');
console.log('');
console.log('【診断結果】');
console.log('   richmenu-cffbb7fc... は "Unregistered" という名前で3ボタン → 未連携用');
console.log('   richmenu-2e269bf... は「未連携ユーザー用」で3ボタン、画像なし → 未連携用');
console.log('');
console.log('❌ 連携済みユーザー用のリッチメニュー（6ボタン）が存在しません');
console.log('');
console.log('【対処方法】');
console.log('1. 設定ページの「LINEリッチメニュー」タブに移動');
console.log('2. 「連携済みユーザー用」タブを選択');
console.log('3. 6つのボタンを設定（QRコード、予約確認、家族登録、Webサイト、お問合せ、予約を取る）');
console.log('4. 「LINE APIに登録」ボタンをクリック');
console.log('5. 「既存メニューを自動読み込み」で新しいメニューを読み込み');
console.log('');
console.log('または');
console.log('');
console.log('LINE Developers Consoleで直接6ボタンのリッチメニューを作成してください。');
