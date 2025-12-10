/**
 * 本番環境のすべての問診票回答をリスト表示
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// .env.localファイルから環境変数を読み込む
const envContent = fs.readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    envVars[key] = value
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
// サービスロールキーを使用（RLSをバイパス）
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 問診票回答を全件取得中...')
console.log('')

try {
  const { data: responses, error: responseError, count } = await supabase
    .from('questionnaire_responses')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (responseError) {
    console.error('❌ 問診票回答取得エラー:', responseError)
    process.exit(1)
  }

  console.log(`✅ ${responses?.length || 0}件の問診票回答を取得しました (Total: ${count})`)
  console.log('')

  if (!responses || responses.length === 0) {
    console.log('⚠️  問診票回答が存在しません')
    process.exit(0)
  }

  responses.forEach((response, index) => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`問診票回答 #${index + 1}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`  ID: ${response.id}`)
    console.log(`  Questionnaire ID: ${response.questionnaire_id}`)
    console.log(`  Patient ID: ${response.patient_id || 'NULL (未連携)'}`)
    console.log(`  Completed at: ${response.completed_at}`)
    console.log(`  Created at: ${response.created_at}`)
    console.log(`  response_data: ${response.response_data ? `${Object.keys(response.response_data).length}キー` : 'NULL'}`)

    if (response.response_data) {
      const keys = Object.keys(response.response_data)
      const sample = keys.slice(0, 5)
      console.log(`  サンプルキー: ${sample.join(', ')}`)

      // キー形式を判定
      const uuidKeys = keys.filter(k => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k))
      const qFormatKeys = keys.filter(k => /^q\d+-\d+$/.test(k))
      console.log(`  UUID形式: ${uuidKeys.length}件, q形式: ${qFormatKeys.length}件`)
    }
    console.log('')
  })

  console.log('✅ 完了')

} catch (error) {
  console.error('❌ エラー:', error.message)
  console.error(error)
  process.exit(1)
}
