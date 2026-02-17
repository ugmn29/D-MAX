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

    console.log('🗑️  非アクティブなスタッフを削除中...\n')

    const inactiveStaff = await prisma.staff.findMany({
      where: {
        clinic_id: defaultClinicId,
        is_active: false
      }
    })

    console.log(`✓ 非アクティブなスタッフ: ${inactiveStaff.length}件`)

    for (const staff of inactiveStaff) {
      console.log(`  削除: ${staff.name} (ID: ${staff.id})`)
      await prisma.staff.delete({
        where: { id: staff.id }
      })
    }

    console.log(`\n✅ ${inactiveStaff.length}件のスタッフを削除しました`)

    // 最終確認
    const finalStaff = await prisma.staff.findMany({
      where: { clinic_id: defaultClinicId },
      include: {
        staff_positions: true
      }
    })

    console.log(`\n📊 残っているスタッフ: ${finalStaff.length}件`)
    finalStaff.forEach(s => {
      const positionName = s.staff_positions?.name || '役職なし'
      console.log(`  - ${s.name} (役職: ${positionName}, is_active: ${s.is_active})`)
    })

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
