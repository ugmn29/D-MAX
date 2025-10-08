// 連携状況データのテストスクリプト
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLinkStatus() {
  console.log('=== 連携状況データテスト ===');
  
  try {
    // 患者データを取得
    const { data: allPatients, error: allError } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', '11111111-1111-1111-1111-111111111111')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('全患者取得エラー:', allError);
      return;
    }

    console.log(`\n全患者数: ${allPatients.length}件`);
    
    // 仮登録患者（未連携）
    const unlinkedPatients = allPatients.filter(p => !p.is_registered);
    console.log(`未連携患者: ${unlinkedPatients.length}件`);
    unlinkedPatients.forEach(patient => {
      console.log(`  - ${patient.last_name} ${patient.first_name} (ID: ${patient.id})`);
    });

    // 本登録患者（連携済み）
    const linkedPatients = allPatients.filter(p => p.is_registered);
    console.log(`\n連携済み患者: ${linkedPatients.length}件`);
    linkedPatients.forEach(patient => {
      console.log(`  - ${patient.last_name} ${patient.first_name} (ID: ${patient.id})`);
    });

    // 問診表回答データも確認
    console.log('\n=== 問診表回答データ確認 ===');
    const { data: responses, error: responseError } = await supabase
      .from('questionnaire_responses')
      .select(`
        *,
        questionnaires (
          id,
          name
        )
      `);

    if (responseError) {
      console.error('問診表回答取得エラー:', responseError);
    } else {
      console.log(`問診表回答数: ${responses.length}件`);
      responses.forEach(response => {
        console.log(`  - 患者ID: ${response.patient_id}, 問診表: ${response.questionnaires?.name || 'Unknown'}`);
      });
    }

  } catch (error) {
    console.error('テストエラー:', error);
  }
}

testLinkStatus();
