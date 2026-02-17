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

    console.log('📋 現在のスタッフと役職を確認中...\n')

    // スタッフ役職を取得
    const positions = await prisma.staff_positions.findMany({
      where: {
        clinic_id: defaultClinicId
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    console.log(`✓ スタッフ役職: ${positions.length}件`)
    positions.forEach(pos => {
      console.log(`  - ${pos.name} (ID: ${pos.id}, sort_order: ${pos.sort_order})`)
    })

    // スタッフを取得
    const staff = await prisma.staff.findMany({
      where: {
        clinic_id: defaultClinicId
      },
      include: {
        staff_positions: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    console.log(`\n✓ スタッフ: ${staff.length}件`)
    staff.forEach(s => {
      const positionName = s.staff_positions?.name || '役職なし'
      console.log(`  - ${s.name} (役職: ${positionName}, ID: ${s.id}, is_active: ${s.is_active})`)
    })

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
