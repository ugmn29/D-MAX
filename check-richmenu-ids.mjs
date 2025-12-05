import pg from 'pg'
const { Client } = pg

const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

const client = new Client({ connectionString })

try {
  await client.connect()

  const result = await client.query(`
    SELECT
      line_registered_rich_menu_id,
      line_unregistered_rich_menu_id
    FROM clinic_settings
    LIMIT 1;
  `)

  console.log('現在のリッチメニューID設定:')
  console.log('連携済み用:', result.rows[0]?.line_registered_rich_menu_id || '(未設定)')
  console.log('未連携用:', result.rows[0]?.line_unregistered_rich_menu_id || '(未設定)')
} catch (error) {
  console.error('Error:', error.message)
} finally {
  await client.end()
}
