/**
 * pgライブラリを使って直接PostgreSQLに接続して外部キーを追加
 */

import pg from 'pg'
import fs from 'fs'

const { Client } = pg

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

const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${envVars.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

console.log('🔧 PostgreSQL接続設定完了')
console.log('')

const sql = `
-- 外部キー制約を追加
ALTER TABLE questionnaire_responses
DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;

ALTER TABLE questionnaire_responses
ADD CONSTRAINT questionnaire_responses_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES patients(id)
ON DELETE SET NULL;
`

const verifySql = `
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'questionnaire_responses'
  AND tc.constraint_type = 'FOREIGN KEY';
`

async function addForeignKey() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🚀 PostgreSQLに接続中...')
    await client.connect()
    console.log('✅ 接続成功')
    console.log('')

    console.log('📝 外部キー制約を追加中...')
    console.log(sql)
    console.log('')

    // SQLを実行
    await client.query(sql)

    console.log('✅ 外部キー制約の追加に成功しました！')
    console.log('')

    // 確認
    console.log('🔍 外部キー制約を確認中...')
    const result = await client.query(verifySql)

    if (result.rows.length > 0) {
      console.log('✅ 外部キー制約が正常に作成されました:')
      console.log('')
      result.rows.forEach(row => {
        console.log(`  テーブル: ${row.table_name}`)
        console.log(`  制約名: ${row.constraint_name}`)
        console.log(`  カラム: ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`)
        console.log('')
      })
    } else {
      console.log('⚠️  外部キー制約が見つかりませんでした')
    }

    return true

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message)
    console.error('')
    console.error('詳細:', error)
    return false
  } finally {
    await client.end()
    console.log('接続を終了しました')
  }
}

const success = await addForeignKey()
process.exit(success ? 0 : 1)
