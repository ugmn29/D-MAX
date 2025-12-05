import pg from 'pg'
const { Client } = pg

const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

const client = new Client({ connectionString })

try {
  await client.connect()

  console.log('=== clinics テーブルの確認 ===\n')

  const result = await client.query(`
    SELECT id, name, created_at
    FROM clinics
    ORDER BY created_at DESC
    LIMIT 5;
  `)

  console.log(`clinicレコード数: ${result.rows.length}\n`)

  if (result.rows.length === 0) {
    console.log('❌ clinicsテーブルにレコードが存在しません')
    console.log('クリニックレコードを作成する必要があります')
  } else {
    console.log('📋 既存のclinic:')
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}`)
      console.log(`   Name: ${row.name}`)
      console.log(`   Created: ${row.created_at}`)
    })
  }

  console.log('\n=== clinic_settings の確認 ===\n')

  const settingsResult = await client.query(`
    SELECT clinic_id, setting_key, line_registered_rich_menu_id, line_unregistered_rich_menu_id
    FROM clinic_settings
    ORDER BY created_at DESC
    LIMIT 5;
  `)

  console.log(`clinic_settingsレコード数: ${settingsResult.rows.length}\n`)

  if (settingsResult.rows.length > 0) {
    console.log('📋 既存のclinic_settings:')
    settingsResult.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. clinic_id: ${row.clinic_id}`)
      console.log(`   setting_key: ${row.setting_key}`)
      console.log(`   registered: ${row.line_registered_rich_menu_id || '(null)'}`)
      console.log(`   unregistered: ${row.line_unregistered_rich_menu_id || '(null)'}`)
    })
  }
} catch (error) {
  console.error('Error:', error.message)
} finally {
  await client.end()
}
