/**
 * questionnaire_responsesテーブルにoriginal_patient_dataカラムを追加
 * 使い方: source .env.local && node run-add-column-migration.mjs
 */

import pg from 'pg'
const { Client } = pg

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

if (!DB_PASSWORD) {
  console.error('❌ 環境変数 SUPABASE_DB_PASSWORD が設定されていません')
  console.error('使い方: source .env.local && node run-add-column-migration.mjs')
  process.exit(1)
}

const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

console.log('🔧 データベースに接続中...')
console.log('')

try {
  await client.connect()
  console.log('✅ 接続成功')
  console.log('')

  // マイグレーションSQLを実行
  const sql = `
    ALTER TABLE questionnaire_responses
    ADD COLUMN IF NOT EXISTS original_patient_data jsonb;

    COMMENT ON COLUMN questionnaire_responses.original_patient_data IS '問診票連携前の患者データ（連携解除時の復元用）';
  `

  console.log('🔧 マイグレーション実行中...')
  await client.query(sql)
  console.log('✅ マイグレーション完了')
  console.log('')
  console.log('カラム「original_patient_data」をquestionnaire_responsesテーブルに追加しました')
  console.log('')

  // 確認
  console.log('🔍 カラムの存在を確認中...')
  const checkResult = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'questionnaire_responses'
    AND column_name = 'original_patient_data'
  `)

  if (checkResult.rows.length > 0) {
    console.log('✅ カラムが正しく追加されました:')
    console.log(`   カラム名: ${checkResult.rows[0].column_name}`)
    console.log(`   データ型: ${checkResult.rows[0].data_type}`)
  } else {
    console.log('⚠️  カラムが見つかりませんでした')
  }

  await client.end()
} catch (error) {
  console.error('❌ エラー:', error.message)
  await client.end()
  process.exit(1)
}
