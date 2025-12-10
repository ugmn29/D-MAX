/**
 * Supabase REST APIを使って直接SQLを実行
 */

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

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Supabase接続情報:')
console.log('  URL:', SUPABASE_URL)
console.log('')

// 実行するSQL
const sql = `
ALTER TABLE questionnaire_responses
DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;

ALTER TABLE questionnaire_responses
ADD CONSTRAINT questionnaire_responses_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES patients(id)
ON DELETE SET NULL;
`

console.log('実行するSQL:')
console.log(sql)
console.log('')

// PostgRESTのSQLエンドポイントを使用
// Supabaseは通常、pgAdminやSQL Editorを使用する必要があります
console.log('⚠️  注意: SupabaseのREST APIでは直接DDL（ALTER TABLE）を実行できません')
console.log('')
console.log('以下の2つの方法のいずれかを使用してください:')
console.log('')
console.log('方法1: Supabase SQL Editorを使用')
console.log('  https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql/new')
console.log('  上記のSQLをコピペして実行')
console.log('')
console.log('方法2: psqlコマンドを使用')
console.log('  以下のコマンドを実行:')
console.log('')
console.log(`PGPASSWORD="${envVars.SUPABASE_DB_PASSWORD}" psql \\`)
console.log(`  "postgresql://postgres.obdfmwpdkwraqqqyjgwu:${envVars.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres" \\`)
console.log(`  -c "${sql.trim().replace(/\n/g, ' ')}"`)
