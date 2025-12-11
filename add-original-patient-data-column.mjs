/**
 * questionnaire_responsesテーブルにoriginal_patient_dataカラムを追加
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 環境変数が設定されていません')
  console.error('使い方: source .env.local && node add-original-patient-data-column.mjs')
  process.exit(1)
}

console.log('🔧 マイグレーション実行中...')
console.log('')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// SQLを直接実行
const sql = `
ALTER TABLE questionnaire_responses
ADD COLUMN IF NOT EXISTS original_patient_data jsonb;

COMMENT ON COLUMN questionnaire_responses.original_patient_data IS '問診票連携前の患者データ（連携解除時の復元用）';
`

try {
  const { data, error } = await supabase.rpc('exec', { sql })

  if (error) {
    console.error('❌ エラー:', error.message)
    console.error('')
    console.error('⚠️  Supabase CLIを使って手動でマイグレーションを実行してください:')
    console.error('')
    console.error('方法1: SQL Editorから直接実行')
    console.error('  1. Supabaseダッシュボードを開く')
    console.error('  2. SQL Editorに移動')
    console.error('  3. 以下のSQLを実行:')
    console.error('')
    console.error('     ALTER TABLE questionnaire_responses')
    console.error('     ADD COLUMN IF NOT EXISTS original_patient_data jsonb;')
    console.error('')
    console.error('方法2: ローカルのマイグレーションファイルをプッシュ')
    console.error('  npx supabase db push --db-url "postgresql://postgres.obdfmwpdkwraqqqyjgwu:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"')
    process.exit(1)
  }

  console.log('✅ マイグレーション完了')
  console.log('')
  console.log('カラム「original_patient_data」をquestionnaire_responsesテーブルに追加しました')
} catch (error) {
  console.error('❌ 実行エラー:', error.message)
  console.error('')
  console.error('⚠️  手動でマイグレーションを実行してください:')
  console.error('')
  console.error('Supabaseダッシュボード > SQL Editor で以下を実行:')
  console.error('')
  console.error('ALTER TABLE questionnaire_responses')
  console.error('ADD COLUMN IF NOT EXISTS original_patient_data jsonb;')
  process.exit(1)
}
