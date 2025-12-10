/**
 * 外部キー制約を追加する簡易マイグレーションスクリプト
 */

import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

if (!SUPABASE_URL || !SUPABASE_DB_PASSWORD) {
  console.error('❌ 環境変数が設定されていません')
  console.error('必要な環境変数: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_DB_PASSWORD')
  process.exit(1)
}

console.log('🔧 Supabase接続情報:')
console.log('  URL:', SUPABASE_URL)
console.log('')

// PostgreSQL接続文字列
const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

// SQLステートメント
const sql = `
-- 既存の制約を削除（存在する場合）
ALTER TABLE questionnaire_responses
DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;

-- 外部キー制約を追加
ALTER TABLE questionnaire_responses
ADD CONSTRAINT questionnaire_responses_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES patients(id)
ON DELETE SET NULL;
`

console.log('🚀 マイグレーションSQL:')
console.log(sql)
console.log('')

console.log('📝 以下のコマンドを実行して外部キーを追加してください:')
console.log('')
console.log('---------- コピーしてターミナルで実行 ----------')
console.log(`PGPASSWORD="${SUPABASE_DB_PASSWORD}" psql "${connectionString}" <<'EOF'`)
console.log(sql.trim())
console.log('EOF')
console.log('------------------------------------------------')
console.log('')
console.log('または、Supabase SQL Editorで以下のSQLを実行:')
console.log(sql)
