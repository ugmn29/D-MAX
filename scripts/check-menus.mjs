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
    const menus = await prisma.treatment_menus.findMany({
      orderBy: [{ level: 'asc' }, { sort_order: 'asc' }]
    })
    console.log(`診療メニュー: ${menus.length}件\n`)
    menus.forEach(m => {
      console.log(`  L${m.level} | ${m.name} | color: "${m.color}" | active: ${m.is_active} | sort: ${m.sort_order} | clinic: ${m.clinic_id}`)
    })
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
main()
