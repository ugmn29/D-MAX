import pg from 'pg'
const { Client } = pg

const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

const client = new Client({ connectionString })

try {
  await client.connect()

  console.log('=== clinic_settings テーブルの確認 ===\n')

  const result = await client.query(`
    SELECT
      clinic_id,
      line_registered_rich_menu_id,
      line_unregistered_rich_menu_id
    FROM clinic_settings
    ORDER BY created_at DESC
    LIMIT 5;
  `)

  console.log(`レコード数: ${result.rows.length}`)

  if (result.rows.length === 0) {
    console.log('\n❌ clinic_settingsテーブルにレコードが存在しません')
    console.log('レコードを作成する必要があります')
  } else {
    console.log('\n📋 clinic_settings の内容:')
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. clinic_id: ${row.clinic_id}`)
      console.log(`   連携済み用: ${row.line_registered_rich_menu_id || '(未設定)'}`)
      console.log(`   未連携用: ${row.line_unregistered_rich_menu_id || '(未設定)'}`)
    })
  }
} catch (error) {
  console.error('Error:', error.message)
} finally {
  await client.end()
}
