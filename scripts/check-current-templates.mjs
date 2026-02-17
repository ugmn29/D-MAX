import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env.local')))
for (const k in envConfig) { process.env[k] = envConfig[k] }

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    const sysReasons = await prisma.system_cancel_reasons.findMany({ orderBy: { sort_order: 'asc' } })
    console.log(`\n=== system_cancel_reasons (${sysReasons.length}件) ===`)
    sysReasons.forEach(r => console.log(`  ${r.sort_order}. ${r.name} (${r.id})`))

    const sysPositions = await prisma.system_staff_positions.findMany({ orderBy: { sort_order: 'asc' } })
    console.log(`\n=== system_staff_positions (${sysPositions.length}件) ===`)
    sysPositions.forEach(p => console.log(`  ${p.sort_order}. ${p.name} (${p.id})`))

    const reasons = await prisma.cancel_reasons.findMany({ orderBy: { sort_order: 'asc' } })
    console.log(`\n=== cancel_reasons クリニック固有 (${reasons.length}件) ===`)
    reasons.forEach(r => console.log(`  ${r.sort_order}. ${r.name} [clinic: ${r.clinic_id}] active=${r.is_active}`))

    const positions = await prisma.staff_positions.findMany({ orderBy: { sort_order: 'asc' } })
    console.log(`\n=== staff_positions クリニック固有 (${positions.length}件) ===`)
    positions.forEach(p => console.log(`  ${p.sort_order}. ${p.name} [clinic: ${p.clinic_id}]`))
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
main()
