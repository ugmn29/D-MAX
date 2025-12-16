import { createClient } from '@supabase/supabase-js';

// 本番環境のSupabase設定（.env.localではなく直接指定）
const PROD_SUPABASE_URL = 'https://obdfmwpdkwraqqqyjgwu.supabase.co';
const PROD_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 本番環境の患者データを確認\n');
console.log('接続先:', PROD_SUPABASE_URL);
console.log('');

const supabase = createClient(PROD_SUPABASE_URL, PROD_SERVICE_ROLE_KEY);

// clinicsテーブル
const { data: clinics } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

if (!clinics || clinics.length === 0) {
  console.error('❌ クリニックが見つかりません');
  process.exit(1);
}

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name}\n`);

// patientsテーブル（line_patient_idカラムを使用）
console.log('【患者データ】');
const { data: patients, error: patientsError } = await supabase
  .from('patients')
  .select('id, patient_number, last_name, first_name, birth_date, line_patient_id, updated_at')
  .eq('clinic_id', clinicId)
  .order('updated_at', { ascending: false })
  .limit(20);

if (patientsError) {
  console.error('❌ エラー:', patientsError);
} else if (!patients || patients.length === 0) {
  console.log('❌ 患者データがありません');
} else {
  console.log(`✅ ${patients.length}件の患者データが見つかりました（最新20件）\n`);

  patients.forEach((p, i) => {
    const hasLine = !!p.line_patient_id;
    const minutesAgo = Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 60000);

    console.log(`${i + 1}. ${p.last_name || ''} ${p.first_name || ''} (${p.patient_number})`);
    console.log(`   生年月日: ${p.birth_date}`);
    console.log(`   LINE: ${hasLine ? '✅ 連携済み' : '❌ 未連携'}`);
    if (hasLine) {
      console.log(`   LINE User ID: ${p.line_patient_id}`);
    }
    console.log(`   更新: ${minutesAgo}分前`);
    console.log('');
  });

  // LINE連携済みの患者
  const linkedPatients = patients.filter(p => p.line_patient_id);

  console.log('='.repeat(60));
  console.log('【統計】\n');
  console.log(`   総患者数（表示範囲）: ${patients.length}件`);
  console.log(`   LINE連携済み: ${linkedPatients.length}件`);
  console.log('');

  if (linkedPatients.length > 0) {
    console.log('【LINE連携済み患者】');
    linkedPatients.forEach(p => {
      console.log(`   - ${p.last_name} ${p.first_name}`);
      console.log(`     LINE User ID: ${p.line_patient_id}`);
    });
    console.log('');
  }

  // line_patient_linkages テーブル
  console.log('【連携履歴テーブル】');
  const { data: linkages } = await supabase
    .from('line_patient_linkages')
    .select('id, line_user_id, patient_id, created_at')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!linkages || linkages.length === 0) {
    console.log('❌ line_patient_linkages テーブルに記録がありません');
    console.log('');
    console.log('⚠️  患者データには line_patient_id が保存されていますが、');
    console.log('   line_patient_linkages テーブルに記録がないため、');
    console.log('   リッチメニュー切り替え処理が実行されていません。');
  } else {
    console.log(`✅ ${linkages.length}件の連携履歴があります`);
    linkages.forEach((l, i) => {
      const minutesAgo = Math.floor((Date.now() - new Date(l.created_at).getTime()) / 60000);
      console.log(`   ${i + 1}. ${minutesAgo}分前 - ${l.line_user_id}`);
    });
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('【結論】\n');

  if (linkedPatients.length > 0 && (!linkages || linkages.length === 0)) {
    console.log('❌ 問題が見つかりました:');
    console.log('   patients テーブルには LINE連携済みの患者がいますが、');
    console.log('   line_patient_linkages テーブルに記録がありません。');
    console.log('');
    console.log('   これは、連携処理の途中で失敗しているか、');
    console.log('   link-patient APIが正常に完了していない可能性があります。');
    console.log('');
    console.log('【対処方法】');
    console.log('   1. もう一度LINEアプリから連携を実行');
    console.log('   2. その直後にこのスクリプトを実行して確認');
    console.log('   3. linkagesテーブルに記録されればリッチメニュー切り替えも実行されます');
  } else if (linkedPatients.length === 0) {
    console.log('⚠️  LINE連携済みの患者がいません');
    console.log('   LINEアプリから患者連携を実行してください。');
  } else {
    console.log('✅ 連携は正常に記録されています');
    console.log('   リッチメニュー切り替えも実行されているはずです。');
  }
}
