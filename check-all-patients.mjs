import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 全患者データと連携状況を確認\n');

// clinic_idを取得
const { data: clinics } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name}\n`);

// 全患者を取得（最近更新された順）
const { data: patients, count } = await supabase
  .from('patients')
  .select('id, patient_number, last_name, first_name, birth_date, line_user_id, updated_at', { count: 'exact' })
  .eq('clinic_id', clinicId)
  .order('updated_at', { ascending: false })
  .limit(20);

console.log(`【患者データ】 総件数: ${count}件\n`);

if (patients && patients.length > 0) {
  console.log('最近更新された患者（上位20件）:\n');

  patients.forEach((patient, i) => {
    const hasLineId = !!patient.line_user_id;
    const updateTime = new Date(patient.updated_at);
    const minutesAgo = Math.floor((Date.now() - updateTime.getTime()) / 60000);

    console.log(`${i + 1}. ${patient.last_name} ${patient.first_name} (${patient.patient_number})`);
    console.log(`   生年月日: ${patient.birth_date}`);
    console.log(`   LINE連携: ${hasLineId ? '✅ 連携済み' : '❌ 未連携'}`);
    if (hasLineId) {
      console.log(`   LINE User ID: ${patient.line_user_id}`);
    }
    console.log(`   更新: ${minutesAgo}分前 (${updateTime.toLocaleString('ja-JP')})`);
    console.log('');
  });

  // LINE連携済みの患者数をカウント
  const linkedPatients = patients.filter(p => p.line_user_id);
  console.log('='.repeat(60));
  console.log(`【統計】`);
  console.log(`   総患者数: ${count}件`);
  console.log(`   LINE連携済み: ${linkedPatients.length}件（表示範囲内）`);
  console.log('');

  // line_patient_linkagesテーブルも確認
  const { data: linkages, count: linkageCount } = await supabase
    .from('line_patient_linkages')
    .select('id, line_user_id, patient_id, created_at', { count: 'exact' })
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(10);

  console.log(`【line_patient_linkages テーブル】 総件数: ${linkageCount}件\n`);

  if (linkages && linkages.length > 0) {
    linkages.forEach((link, i) => {
      const minutesAgo = Math.floor((Date.now() - new Date(link.created_at).getTime()) / 60000);
      console.log(`${i + 1}. ${minutesAgo}分前`);
      console.log(`   LINE User ID: ${link.line_user_id}`);
      console.log(`   Patient ID: ${link.patient_id}`);
      console.log(`   作成: ${new Date(link.created_at).toLocaleString('ja-JP')}`);
      console.log('');
    });
  } else {
    console.log('   連携履歴がありません');
  }

} else {
  console.log('患者データがありません');
}

console.log('='.repeat(60));
console.log('【分析】\n');

const recentLinkedPatients = patients?.filter(p => {
  if (!p.line_user_id) return false;
  const minutesAgo = Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 60000);
  return minutesAgo < 60; // 過去1時間
});

if (recentLinkedPatients && recentLinkedPatients.length > 0) {
  console.log(`✅ 過去1時間に${recentLinkedPatients.length}件のLINE連携がありました`);
  console.log('');
  recentLinkedPatients.forEach(p => {
    console.log(`   - ${p.last_name} ${p.first_name}`);
    console.log(`     LINE User ID: ${p.line_user_id}`);
  });
  console.log('');
  console.log('⚠️  患者データには line_user_id が保存されていますが、');
  console.log('   line_patient_linkages テーブルに記録がない場合、');
  console.log('   リッチメニュー切り替え処理が実行されていない可能性があります。');
} else {
  console.log('❌ 過去1時間にLINE連携された患者はいません');
  console.log('');
  console.log('連携処理が正常に完了していない可能性があります。');
  console.log('もう一度LINEアプリから連携を試してください。');
}
