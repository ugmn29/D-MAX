import pg from 'pg'
const { Client } = pg

const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

const client = new Client({ connectionString })

try {
  await client.connect()

  console.log('=== clinic_settings テーブルの構造確認 ===\n')

  // カラム情報を取得
  const columns = await client.query(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'clinic_settings'
    ORDER BY ordinal_position;
  `)

  console.log('📋 カラム一覧:')
  columns.rows.forEach(col => {
    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'なし'})`)
  })

  console.log('\n=== 既存データの確認 ===\n')

  const data = await client.query(`
    SELECT * FROM clinic_settings LIMIT 5;
  `)

  console.log(`レコード数: ${data.rows.length}\n`)

  if (data.rows.length > 0) {
    data.rows.forEach((row, i) => {
      console.log(`${i + 1}. clinic_id: ${row.clinic_id}`)
      console.log(`   setting_key: ${row.setting_key}`)
      console.log(`   line_registered_rich_menu_id: ${row.line_registered_rich_menu_id || '(null)'}`)
      console.log(`   line_unregistered_rich_menu_id: ${row.line_unregistered_rich_menu_id || '(null)'}`)
      console.log('')
    })
  } else {
    console.log('❌ レコードが存在しません')
  }
} catch (error) {
  console.error('Error:', error.message)
} finally {
  await client.end()
}
