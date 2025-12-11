/**
 * questionnaire_responsesのoriginal_patient_dataを確認
 */

const SUPABASE_URL = 'https://obdfmwpdkwraqqqyjgwu.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjMyMzQwNCwiZXhwIjoyMDQ3ODk5NDA0fQ.lG5ug5Ee_WU76l6Xj1Dz6WQhujcHtE04l-w_DwMcqUE'

console.log('🔍 original_patient_dataの確認...')
console.log('')

const response = await fetch(`${SUPABASE_URL}/rest/v1/questionnaire_responses?select=id,patient_id,original_patient_data&patient_id=not.is.null&order=updated_at.desc&limit=20`, {
  headers: {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  }
})

const data = await response.json()

console.log(`✅ 連携済み問診票: ${data.length}件`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

data.forEach((r, index) => {
  console.log(`問診票${index + 1}:`)
  console.log(`  ID: ${r.id}`)
  console.log(`  患者ID: ${r.patient_id}`)
  console.log(`  original_patient_data: ${r.original_patient_data ? 'あり ✅' : 'なし ❌'}`)
  if (r.original_patient_data) {
    console.log(`    元の名前: ${r.original_patient_data.last_name} ${r.original_patient_data.first_name}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
})
