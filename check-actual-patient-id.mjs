/**
 * 本番環境の問診票のpatient_idの実際の値を確認
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://obdfmwpdkwraqqqyjgwu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExMzI1NTAsImV4cCI6MjA0NjcwODU1MH0.P3PsYW0F5rLmMLmfQm5d9SJ5lZ-U3HPoT6ot9_VO5Dk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 本番環境の問診票を確認中...')
console.log('')

try {
  // 全ての問診票回答を取得
  const { data: responses, error } = await supabase
    .from('questionnaire_responses')
    .select('id, patient_id, completed_at, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }

  console.log(`✅ ${responses.length}件の問診票回答を取得しました`)
  console.log('')

  responses.forEach((r, i) => {
    console.log(`${i + 1}. ID: ${r.id}`)
    console.log(`   patient_id: ${r.patient_id === null ? 'NULL (未連携)' : r.patient_id}`)
    console.log(`   patient_id型: ${typeof r.patient_id}`)
    console.log(`   completed_at: ${r.completed_at}`)
    console.log(`   created_at: ${r.created_at}`)
    console.log('')
  })

  // 未連携の問診票をカウント
  const unlinkedCount = responses.filter(r => r.patient_id === null).length
  const linkedCount = responses.filter(r => r.patient_id !== null).length

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`未連携: ${unlinkedCount}件`)
  console.log(`連携済み: ${linkedCount}件`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━')

} catch (error) {
  console.error('❌ エラー:', error.message)
}
