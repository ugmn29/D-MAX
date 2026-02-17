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

    console.log('🗑️  シフトとスタッフをすべて削除します...\n')

    // 1. シフトデータを削除
    const shiftsCount = await prisma.staff_shifts.deleteMany({
      where: {
        clinic_id: defaultClinicId
      }
    })
    console.log(`✅ ${shiftsCount.count}件のシフトを削除しました`)

    // 2. スタッフを削除
    const staffCount = await prisma.staff.deleteMany({
      where: {
        clinic_id: defaultClinicId
      }
    })
    console.log(`✅ ${staffCount.count}件のスタッフを削除しました`)

    // 3. スタッフ役職を削除
    const positionsCount = await prisma.staff_positions.deleteMany({
      where: {
        clinic_id: defaultClinicId
      }
    })
    console.log(`✅ ${positionsCount.count}件のスタッフ役職を削除しました`)

    console.log('\n✨ クリーンアップ完了')

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
