/**
 * 本番環境でlinked_field修正APIをテストする
 */

const url = 'https://dmax-mu.vercel.app/api/questionnaires/fix-linked-fields'

console.log('🔧 問診票のlinked_field修正APIを実行中...')
console.log(`URL: ${url}`)
console.log('')

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()

  console.log('レスポンスステータス:', response.status)
  console.log('')

  if (data.success) {
    console.log('✅ 成功!')
    console.log(`メッセージ: ${data.message}`)
    console.log(`修正件数: ${data.fixed}件`)

    if (data.errors && data.errors.length > 0) {
      console.log('')
      console.log('⚠️  一部エラーが発生しました:')
      data.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`)
      })
    }
  } else {
    console.error('❌ エラー:', data.error)
  }

  console.log('')
  console.log('完全なレスポンス:')
  console.log(JSON.stringify(data, null, 2))

} catch (error) {
  console.error('❌ 実行エラー:', error.message)
}
