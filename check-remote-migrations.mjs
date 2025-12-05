import pg from 'pg'
const { Client } = pg

const connectionString = `postgresql://postgres.obdfmwpdkwraqqqyjgwu:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`

const client = new Client({ connectionString })

try {
  await client.connect()

  const result = await client.query(`
    SELECT version, name, statements
    FROM supabase_migrations.schema_migrations
    WHERE version IN ('20251112', '20251113')
    ORDER BY version;
  `)

  console.log('Remote-only migrations:')
  result.rows.forEach(row => {
    console.log(`\nVersion: ${row.version}`)
    console.log(`Name: ${row.name}`)
    console.log(`Statements: ${JSON.stringify(row.statements, null, 2)}`)
  })
} catch (error) {
  console.error('Error:', error.message)
} finally {
  await client.end()
}
