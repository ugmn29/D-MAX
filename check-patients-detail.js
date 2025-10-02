const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPatients() {
  console.log('全患者データを確認中...\n')

  // 全患者を取得
  const { data: allPatients, error: allError } = await supabase
    .from('patients')
    .select('id, patient_number, last_name, first_name, is_registered, clinic_id')

  if (allError) {
    console.error('エラー:', allError)
    return
  }

  console.log(`全患者数: ${allPatients?.length || 0}`)
  console.table(allPatients)

  // patient_number > 0 の患者
  const withNumber = allPatients?.filter(p => p.patient_number > 0) || []
  console.log(`\n診察券番号が振られている患者数: ${withNumber.length}`)
  console.table(withNumber)

  // is_registered = true の患者
  const registered = allPatients?.filter(p => p.is_registered) || []
  console.log(`\nis_registered = true の患者数: ${registered.length}`)
  console.table(registered)

  // clinic_id の確認
  const clinicIds = [...new Set(allPatients?.map(p => p.clinic_id))]
  console.log('\n患者データに含まれるclinic_id:')
  console.log(clinicIds)
}

checkPatients()
