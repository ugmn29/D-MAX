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

    console.log('🔍 孤立したシフトデータを確認中...\n')

    // スタッフテーブルにあるスタッフIDを取得
    const activeStaff = await prisma.staff.findMany({
      where: {
        clinic_id: defaultClinicId
      },
      select: {
        id: true,
        name: true
      }
    })

    const activeStaffIds = new Set(activeStaff.map(s => s.id))
    console.log(`✓ 現在のスタッフ数: ${activeStaff.length}名`)
    activeStaff.forEach(s => {
      console.log(`  - ${s.name} (${s.id})`)
    })

    // シフトテーブルにあるスタッフIDを取得
    const allShifts = await prisma.staff_shifts.findMany({
      where: {
        clinic_id: defaultClinicId
      },
      select: {
        id: true,
        staff_id: true,
        date: true
      }
    })

    console.log(`\n✓ シフトデータ総数: ${allShifts.length}件`)

    // 孤立したシフト（存在しないスタッフIDを持つシフト）を特定
    const orphanedShifts = allShifts.filter(shift => !activeStaffIds.has(shift.staff_id))

    if (orphanedShifts.length === 0) {
      console.log('\n✅ 孤立したシフトデータはありません')
    } else {
      console.log(`\n⚠️  孤立したシフトデータ: ${orphanedShifts.length}件`)

      // 孤立したシフトのスタッフIDごとにグループ化
      const orphanedByStaffId = {}
      orphanedShifts.forEach(shift => {
        if (!orphanedByStaffId[shift.staff_id]) {
          orphanedByStaffId[shift.staff_id] = []
        }
        orphanedByStaffId[shift.staff_id].push(shift)
      })

      console.log('\n孤立したシフトの詳細:')
      for (const [staffId, shifts] of Object.entries(orphanedByStaffId)) {
        console.log(`  スタッフID: ${staffId} - ${shifts.length}件のシフト`)
      }

      console.log('\n🗑️  孤立したシフトデータを削除します...')

      const deletedCount = await prisma.staff_shifts.deleteMany({
        where: {
          clinic_id: defaultClinicId,
          staff_id: {
            notIn: Array.from(activeStaffIds)
          }
        }
      })

      console.log(`✅ ${deletedCount.count}件のシフトデータを削除しました`)
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
