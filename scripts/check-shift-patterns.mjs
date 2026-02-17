import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.join(__dirname, '../.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    const defaultClinicId = '6a039f35-3e50-4009-8df9-5023464ee693'

    console.log('📋 シフトパターンを確認中...\n')

    const patterns = await prisma.shift_patterns.findMany({
      where: {
        clinic_id: defaultClinicId
      },
      orderBy: {
        abbreviation: 'asc'
      }
    })

    console.log(`✓ シフトパターン: ${patterns.length}件\n`)

    if (patterns.length === 0) {
      console.log('⚠️  シフトパターンが登録されていません！')
      console.log('設定画面でシフトパターンを登録してください。')
    } else {
      patterns.forEach(p => {
        console.log(`  - ${p.abbreviation}: ${p.name} (${p.start_time} - ${p.end_time})`)
        console.log(`    ID: ${p.id}`)
      })
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
