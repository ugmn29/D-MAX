import pg from 'pg'
const { Client } = pg

const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

const client = new Client({ connectionString })

try {
  console.log('Connecting to production database...')
  await client.connect()
  console.log('✅ Connected')

  console.log('\nAdding columns to clinic_settings...')
  await client.query(`
    ALTER TABLE clinic_settings
    ADD COLUMN IF NOT EXISTS line_registered_rich_menu_id TEXT,
    ADD COLUMN IF NOT EXISTS line_unregistered_rich_menu_id TEXT;
  `)
  console.log('✅ Columns added')

  console.log('\nAdding comments...')
  await client.query(`
    COMMENT ON COLUMN clinic_settings.line_registered_rich_menu_id IS 'Rich menu ID for registered users';
  `)
  await client.query(`
    COMMENT ON COLUMN clinic_settings.line_unregistered_rich_menu_id IS 'Rich menu ID for unregistered users';
  `)
  console.log('✅ Comments added')

  console.log('\nVerifying columns...')
  const result = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'clinic_settings'
      AND column_name LIKE '%rich_menu%'
    ORDER BY column_name;
  `)

  console.log('\n📋 Rich menu columns:')
  result.rows.forEach(row => {
    console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`)
  })

  console.log('\n🎉 Migration completed successfully!')
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
} finally {
  await client.end()
}
