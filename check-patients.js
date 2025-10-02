const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPatients() {
  console.log('患者データを確認中...\n')

  const { data, error } = await supabase
    .from('patients')
    .select('id, patient_number, last_name, first_name, is_registered, clinic_id')
    .limit(10)

  if (error) {
    console.error('エラー:', error)
    return
  }

  console.log(`患者数: ${data?.length || 0}`)
  console.log('患者データ:')
  console.table(data)
}

checkPatients()
