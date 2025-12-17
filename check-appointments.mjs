import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://obdfmwpdkwraqqqyjgwu.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  // 1. 連携データを確認
  const { data: linkages, error: linkageError } = await supabase
    .from('line_patient_linkages')
    .select('*')
    .limit(5)

  console.log('=== LINE連携データ ===')
  console.log('件数:', linkages?.length || 0)
  if (linkageError) {
    console.log('エラー:', linkageError.message)
  }
  if (linkages && linkages.length > 0) {
    linkages.forEach(l => {
      console.log(`  - patient_id: ${l.patient_id}`)
      console.log(`    line_user_id: ${l.line_user_id}`)
    })
  }

  // 2. 今日以降の予約を確認
  const today = new Date().toISOString().split('T')[0]
  const { data: appointments, error: aptError } = await supabase
    .from('appointments')
    .select('id, patient_id, appointment_date, status')
    .gte('appointment_date', today)
    .limit(10)

  console.log('\n=== 今日以降の予約 ===')
  console.log('件数:', appointments?.length || 0)
  if (aptError) {
    console.log('エラー:', aptError.message)
  }
  if (appointments && appointments.length > 0) {
    appointments.forEach(a => {
      console.log(`  - patient_id: ${a.patient_id}, date: ${a.appointment_date}, status: ${a.status}`)
    })
  }

  // 3. 連携患者のIDと予約のIDを比較
  if (linkages && linkages.length > 0 && appointments && appointments.length > 0) {
    const linkagePatientIds = linkages.map(l => l.patient_id)
    const appointmentPatientIds = [...new Set(appointments.map(a => a.patient_id))]

    console.log('\n=== ID比較 ===')
    console.log('連携患者ID:', linkagePatientIds)
    console.log('予約患者ID:', appointmentPatientIds)

    const matching = appointmentPatientIds.filter(id => linkagePatientIds.includes(id))
    console.log('一致するID:', matching.length > 0 ? matching : 'なし')
  }
}

check().catch(console.error)
