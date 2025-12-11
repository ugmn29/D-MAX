/**
 * questionnaire_responsesのoriginal_patient_dataを確認
 *
 * 使い方: source .env.local && node check-original-data.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 環境変数が設定されていません')
  console.error('使い方: source .env.local && node check-original-data.mjs')
  process.exit(1)
}

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

if (!response.ok) {
  console.error('❌ エラー:', data)
  process.exit(1)
}

if (!Array.isArray(data)) {
  console.error('❌ データが配列ではありません:', data)
  process.exit(1)
}

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
