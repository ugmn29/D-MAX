/**
 * pgライブラリを使って直接PostgreSQLに接続してoriginal_patient_dataカラムを追加
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
-- original_patient_dataカラムを追加
ALTER TABLE questionnaire_responses
ADD COLUMN IF NOT EXISTS original_patient_data jsonb;

COMMENT ON COLUMN questionnaire_responses.original_patient_data IS '問診票連携前の患者データ（連携解除時の復元用）';
`

const verifySql = `
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questionnaire_responses'
  AND column_name = 'original_patient_data';
`

async function addColumn() {
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

    console.log('📝 original_patient_dataカラムを追加中...')
    console.log(sql)
    console.log('')

    // SQLを実行
    await client.query(sql)

    console.log('✅ カラムの追加に成功しました!')
    console.log('')

    // 確認
    console.log('🔍 カラムの存在を確認中...')
    const result = await client.query(verifySql)

    if (result.rows.length > 0) {
      console.log('✅ カラムが正常に作成されました:')
      console.log('')
      result.rows.forEach(row => {
        console.log(`  カラム名: ${row.column_name}`)
        console.log(`  データ型: ${row.data_type}`)
        console.log(`  NULL許可: ${row.is_nullable}`)
        console.log('')
      })
    } else {
      console.log('⚠️  カラムが見つかりませんでした')
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

const success = await addColumn()
process.exit(success ? 0 : 1)
