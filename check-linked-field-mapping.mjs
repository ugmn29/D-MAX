/**
 * 本番環境の問診票の質問とlinked_fieldのマッピングを確認
 */

const url = 'https://dmax-mu.vercel.app/api/questionnaires/debug?clinic_id=11111111-1111-1111-1111-111111111111'

console.log('🔍 問診票の質問とlinked_fieldを確認中...')
console.log('')

try {
  const response = await fetch(url)
  const data = await response.json()

  if (!data.success) {
    console.error('❌ エラー:', data.error)
    process.exit(1)
  }

  console.log('✅ データ取得成功')
  console.log('')

  // linked_fieldが設定されている質問を表示
  const linkedQuestions = data.questions.filter(q => q.linked_field)

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`linked_fieldが設定されている質問: ${linkedQuestions.length}件`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log('')

  linkedQuestions.forEach((q, i) => {
    console.log(`${i + 1}. 質問: "${q.question_text}"`)
    console.log(`   → linked_field: ${q.linked_field}`)
    console.log(`   → question_id: ${q.id}`)
    console.log(`   → section: ${q.section_name}`)
    console.log('')
  })

  // 問診票回答データのサンプル
  if (data.responses && data.responses.length > 0) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`問診票回答データのサンプル`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log('')

    const response = data.responses[0]
    const responseData = response.response_data
    const keys = Object.keys(responseData)

    console.log(`総キー数: ${keys.length}`)
    console.log('')

    // 名前関連のキーを表示
    console.log('名前・ふりがな関連のキー:')
    const nameKeys = keys.filter(k => {
      const value = responseData[k]
      const keyLower = k.toLowerCase()
      return value && (
        keyLower.includes('name') ||
        keyLower.includes('名') ||
        keyLower.includes('patient')
      )
    })

    nameKeys.forEach(k => {
      console.log(`  ${k}: "${responseData[k]}"`)
    })

    console.log('')
    console.log('全キーのサンプル（最初の20件）:')
    keys.slice(0, 20).forEach(k => {
      const value = responseData[k]
      const displayValue = typeof value === 'string' && value.length > 50
        ? value.substring(0, 50) + '...'
        : value
      console.log(`  ${k}: ${JSON.stringify(displayValue)}`)
    })
  } else {
    console.log('⚠️  問診票回答データがありません')
  }

} catch (error) {
  console.error('❌ エラー:', error.message)
}
