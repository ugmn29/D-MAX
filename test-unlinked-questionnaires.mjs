/**
 * 未連携問診票API呼び出しテスト
 */

const clinicId = '11111111-1111-1111-1111-111111111111'

const url = `https://dmax-mu.vercel.app/api/questionnaires/unlinked?clinicId=${clinicId}`

console.log('🔍 未連携問診票APIを呼び出し中...')
console.log(`URL: ${url}`)
console.log('')

try {
  const response = await fetch(url)
  const data = await response.json()

  console.log('レスポンスステータス:', response.status)
  console.log('')

  if (data.success) {
    console.log('✅ 成功')
    console.log(`未連携問診票数: ${data.responses?.length || 0}件`)
    console.log('')

    if (data.responses && data.responses.length > 0) {
      console.log('未連携問診票一覧:')
      data.responses.forEach((r, i) => {
        console.log(`${i + 1}. ID: ${r.id}`)
        console.log(`   Patient ID: ${r.patient_id || 'NULL'}`)
        console.log(`   Completed: ${r.completed_at}`)
        console.log(`   Name: ${r.response_data?.patient_name || r.response_data?.['q1-1'] || '不明'}`)
        console.log(`   Phone: ${r.response_data?.patient_phone || r.response_data?.['q1-10'] || '不明'}`)
        console.log('')
      })
    } else {
      console.log('⚠️  未連携問診票が0件です')
    }
  } else {
    console.error('❌ エラー:', data.error)
    console.error('詳細:', data.details)
  }

  console.log('完全なレスポンス:')
  console.log(JSON.stringify(data, null, 2))

} catch (error) {
  console.error('❌ 呼び出しエラー:', error.message)
}
