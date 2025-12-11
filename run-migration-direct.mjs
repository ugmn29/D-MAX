/**
 * データベースに直接マイグレーションを実行
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 環境変数が設定されていません')
  console.error('使い方: source .env.local && node run-migration-direct.mjs')
  process.exit(1)
}

console.log('🔧 マイグレーション実行中...')
console.log('')

// original_patient_dataカラムを追加
const sql = `
ALTER TABLE questionnaire_responses
ADD COLUMN IF NOT EXISTS original_patient_data jsonb;
`

try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  })

  const result = await response.json()

  if (!response.ok) {
    console.error('❌ エラー:', result)
    process.exit(1)
  }

  console.log('✅ マイグレーション完了')
  console.log('')
  console.log('カラム「original_patient_data」をquestionnaire_responsesテーブルに追加しました')
} catch (error) {
  console.error('❌ 実行エラー:', error.message)
  process.exit(1)
}
