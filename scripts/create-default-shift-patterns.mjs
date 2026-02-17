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

    console.log('📋 デフォルトシフトパターンを作成中...\n')

    const defaultPatterns = [
      {
        clinic_id: defaultClinicId,
        abbreviation: '日',
        name: '日勤',
        start_time: '09:00',
        end_time: '18:00',
        break_start: '12:00',
        break_end: '13:00'
      },
      {
        clinic_id: defaultClinicId,
        abbreviation: '遅',
        name: '遅番',
        start_time: '12:00',
        end_time: '21:00',
        break_start: '15:00',
        break_end: '16:00'
      },
      {
        clinic_id: defaultClinicId,
        abbreviation: '休',
        name: '休み',
        start_time: null,
        end_time: null,
        break_start: null,
        break_end: null
      }
    ]

    for (const pattern of defaultPatterns) {
      const created = await prisma.shift_patterns.create({
        data: pattern
      })
      console.log(`✅ ${created.abbreviation}: ${created.name} を作成しました`)
    }

    console.log(`\n✨ ${defaultPatterns.length}件のシフトパターンを作成しました`)

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
