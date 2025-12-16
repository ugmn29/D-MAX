import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 データベース接続確認\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : '❌ 未設定');
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

// 1. clinicsテーブルを確認
console.log('【1. clinicsテーブル】');
const { data: clinics, error: clinicsError } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(5);

if (clinicsError) {
  console.error('❌ エラー:', clinicsError);
} else {
  console.log(`✅ ${clinics.length}件のクリニックが見つかりました`);
  clinics.forEach(c => console.log(`   - ${c.name} (${c.id})`));
}
console.log('');

if (!clinics || clinics.length === 0) {
  console.log('クリニックデータがありません。処理を中断します。');
  process.exit(1);
}

const clinicId = clinics[0].id;

// 2. patientsテーブルを確認（カウントなし）
console.log('【2. patientsテーブル】');
const { data: patients, error: patientsError } = await supabase
  .from('patients')
  .select('id, patient_number, last_name, first_name, birth_date, line_user_id, updated_at')
  .eq('clinic_id', clinicId)
  .order('updated_at', { ascending: false })
  .limit(10);

if (patientsError) {
  console.error('❌ エラー:', patientsError);
} else if (!patients || patients.length === 0) {
  console.log('❌ 患者データが見つかりません');
} else {
  console.log(`✅ ${patients.length}件の患者が見つかりました（最新10件）\n`);

  patients.forEach((p, i) => {
    console.log(`${i + 1}. ${p.last_name} ${p.first_name} (${p.patient_number})`);
    console.log(`   生年月日: ${p.birth_date}`);
    console.log(`   LINE: ${p.line_user_id ? '✅ 連携済み (' + p.line_user_id + ')' : '❌ 未連携'}`);
    console.log(`   更新: ${new Date(p.updated_at).toLocaleString('ja-JP')}`);
    console.log('');
  });
}

// 3. line_patient_linkagesテーブルを確認
console.log('【3. line_patient_linkagesテーブル】');
const { data: linkages, error: linkagesError } = await supabase
  .from('line_patient_linkages')
  .select('id, line_user_id, patient_id, created_at')
  .eq('clinic_id', clinicId)
  .order('created_at', { ascending: false })
  .limit(10);

if (linkagesError) {
  console.error('❌ エラー:', linkagesError);
} else if (!linkages || linkages.length === 0) {
  console.log('❌ 連携履歴が見つかりません');
} else {
  console.log(`✅ ${linkages.length}件の連携履歴が見つかりました\n`);

  linkages.forEach((l, i) => {
    console.log(`${i + 1}. ${new Date(l.created_at).toLocaleString('ja-JP')}`);
    console.log(`   LINE User ID: ${l.line_user_id}`);
    console.log(`   Patient ID: ${l.patient_id}`);
    console.log('');
  });
}

console.log('='.repeat(60));
console.log('【結論】\n');

if (patients && patients.length > 0) {
  const linkedPatients = patients.filter(p => p.line_user_id);
  console.log(`✅ 患者データは存在します（${patients.length}件確認）`);
  console.log(`   うち LINE連携済み: ${linkedPatients.length}件`);

  if (linkedPatients.length > 0 && (!linkages || linkages.length === 0)) {
    console.log('');
    console.log('⚠️  重要な発見:');
    console.log('   patients テーブルには line_user_id が保存されていますが、');
    console.log('   line_patient_linkages テーブルに記録がありません。');
    console.log('');
    console.log('   これは以下のいずれかを意味します:');
    console.log('   1. 連携処理が途中で失敗した');
    console.log('   2. リッチメニュー切り替え処理が実行されなかった');
    console.log('   3. 古い連携方法で連携された（linkagesテーブルができる前）');
  }
} else {
  console.log('❌ 患者データが見つかりません');
  console.log('   データベース接続に問題があるか、患者が登録されていません。');
}
