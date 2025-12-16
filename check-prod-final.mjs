import { createClient } from '@supabase/supabase-js';

// 本番環境の設定
const PROD_URL = 'https://obdfmwpdkwraqqqyjgwu.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5NzU5MzAsImV4cCI6MjA0NjU1MTkzMH0.Z3VX9X3qxJ_Cl2-1tmnGPi-wGwxKPwXxYC5d9iQZ7XA';

console.log('🔍 本番環境のデータベースを確認\n');

const supabase = createClient(PROD_URL, PROD_ANON_KEY);

const { data: clinics } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

if (!clinics || clinics.length === 0) {
  console.log('❌ クリニックが見つかりません');
  process.exit(1);
}

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name}\n`);

// LINE設定
const { data: lineSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line')
  .maybeSingle();

console.log('【LINE基本設定】');
if (lineSettings?.setting_value) {
  const token = lineSettings.setting_value.channel_access_token || '';
  const isTestToken = token.startsWith('test-');
  const displayToken = token.slice(0, 40) + '...';
  console.log(`   Access Token: ${displayToken}`);
  console.log(`   ${isTestToken ? '❌ テストトークン（切り替え不可）' : '✅ 本番トークン'}`);
} else {
  console.log('   ❌ 未設定');
}
console.log('');

// リッチメニューID設定
const { data: richMenuSettings } = await supabase
  .from('clinic_settings')
  .select('setting_value')
  .eq('clinic_id', clinicId)
  .eq('setting_key', 'line_rich_menu')
  .maybeSingle();

console.log('【リッチメニューID設定】');
if (richMenuSettings?.setting_value) {
  const registered = richMenuSettings.setting_value.line_registered_rich_menu_id;
  const unregistered = richMenuSettings.setting_value.line_unregistered_rich_menu_id;
  console.log(`   連携済み: ${registered || '❌'}`);
  console.log(`   未連携: ${unregistered || '❌'}`);
} else {
  console.log('   ❌ 未設定');
}
console.log('');

// 患者データ
const { data: patients } = await supabase
  .from('patients')
  .select('id, patient_number, last_name, first_name, line_patient_id, updated_at')
  .eq('clinic_id', clinicId)
  .order('updated_at', { ascending: false })
  .limit(10);

console.log('【患者データ】');
if (patients && patients.length > 0) {
  const linkedPatients = patients.filter(p => p.line_patient_id);
  console.log(`   総数: ${patients.length}件（最新10件）`);
  console.log(`   LINE連携済み: ${linkedPatients.length}件\n`);

  if (linkedPatients.length > 0) {
    console.log('   最新のLINE連携患者:');
    linkedPatients.slice(0, 3).forEach(p => {
      const minutesAgo = Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 60000);
      console.log(`   - ${p.last_name || ''} ${p.first_name || ''} (${minutesAgo}分前)`);
      console.log(`     LINE ID: ${p.line_patient_id.slice(0, 30)}...`);
    });
  }
} else {
  console.log('   ❌ 患者データなし');
}
console.log('');

// 連携履歴
const { data: linkages } = await supabase
  .from('line_patient_linkages')
  .select('id, line_user_id, created_at')
  .eq('clinic_id', clinicId)
  .order('created_at', { ascending: false })
  .limit(5);

console.log('【連携履歴】');
if (linkages && linkages.length > 0) {
  console.log(`   ✅ ${linkages.length}件の履歴\n`);
  linkages.forEach((l, i) => {
    const minutesAgo = Math.floor((Date.now() - new Date(l.created_at).getTime()) / 60000);
    const displayId = l.line_user_id.slice(0, 30) + '...';
    console.log(`   ${i + 1}. ${minutesAgo}分前 - ${displayId}`);
  });
} else {
  console.log('   ❌ 履歴なし（リッチメニュー切り替えが実行されていない）');
}

console.log('');
console.log('='.repeat(60));
console.log('【診断結果】\n');

const hasToken = lineSettings?.setting_value?.channel_access_token;
const isTestToken = hasToken && hasToken.startsWith('test-');
const hasMenuIds = richMenuSettings?.setting_value?.line_registered_rich_menu_id &&
                   richMenuSettings?.setting_value?.line_unregistered_rich_menu_id;
const hasLinkages = linkages && linkages.length > 0;
const hasLinkedPatients = patients && patients.some(p => p.line_patient_id);

if (isTestToken) {
  console.log('❌ 【原因】テストトークンが設定されています');
  console.log('   本番のChannel Access Tokenに変更してください');
} else if (!hasToken) {
  console.log('❌ 【原因】Channel Access Tokenが未設定です');
} else if (!hasMenuIds) {
  console.log('❌ 【原因】リッチメニューIDが未設定です');
} else if (hasLinkedPatients && !hasLinkages) {
  console.log('⚠️  【原因判明】患者はLINE連携済みですが、連携履歴テーブルに記録がありません');
  console.log('');
  console.log('   これは /api/line/link-patient の処理が途中で失敗しているか、');
  console.log('   リッチメニュー切り替え処理まで到達していないことを意味します。');
  console.log('');
  console.log('【対処方法】');
  console.log('   1. もう一度LINEアプリから連携を実行');
  console.log('   2. 連携直後にこのスクリプトを実行');
  console.log('   3. 連携履歴が記録されればリッチメニュー切り替えも実行されます');
} else if (!hasLinkages) {
  console.log('⚠️  まだLINE連携が実行されていません');
  console.log('   LINEアプリから患者連携を実行してください');
} else {
  console.log('✅ すべての設定が正しいです');
  console.log('   リッチメニュー切り替えは実行されています。');
  console.log('');
  console.log('   それでも未連携メニューが表示される場合:');
  console.log('   1. LINEアプリを完全終了して再起動');
  console.log('   2. キャッシュが残っている可能性');
  console.log('   3. 別のLINEアカウントで確認');
}
