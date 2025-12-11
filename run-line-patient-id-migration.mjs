import pg from 'pg'
import fs from 'fs'
const { Client } = pg

const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

const client = new Client({ connectionString })

try {
  console.log('Connecting to production database...')
  await client.connect()
  console.log('✅ Connected')

  // マイグレーションSQLファイルを読み込み
  const migrationSQL = fs.readFileSync('./supabase/migrations/20251211000001_fix_line_patient_id_to_text.sql', 'utf8')

  console.log('\n🔧 Applying migration: Fix LINE tables patient_id to TEXT...')
  await client.query(migrationSQL)
  console.log('✅ Migration applied successfully')

  console.log('\n📋 Verifying line_invitation_codes table structure...')
  const invitationCodesResult = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'line_invitation_codes'
      AND column_name = 'patient_id'
  `)

  if (invitationCodesResult.rows.length > 0) {
    const col = invitationCodesResult.rows[0]
    console.log(`  line_invitation_codes.patient_id: ${col.data_type} (nullable: ${col.is_nullable})`)
  }

  console.log('\n📋 Verifying line_patient_linkages table structure...')
  const linkagesResult = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'line_patient_linkages'
      AND column_name = 'patient_id'
  `)

  if (linkagesResult.rows.length > 0) {
    const col = linkagesResult.rows[0]
    console.log(`  line_patient_linkages.patient_id: ${col.data_type} (nullable: ${col.is_nullable})`)
  }

  console.log('\n🎉 Migration completed successfully!')
} catch (error) {
  console.error('❌ Error:', error.message)
  console.error('Details:', error)
  process.exit(1)
} finally {
  await client.end()
}
