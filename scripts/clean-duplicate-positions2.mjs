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

const REAL_CLINIC_ID = '6a039f35-3e50-4009-8df9-5023464ee693'

async function main() {
  try {
    console.log('🧹 重複スタッフ役職を整理中...\n')

    const positions = await prisma.staff_positions.findMany({
      where: { clinic_id: REAL_CLINIC_ID },
      include: { staff: { select: { id: true, name: true } } },
      orderBy: { created_at: 'asc' }
    })

    console.log(`現在のスタッフ役職: ${positions.length}件`)
    positions.forEach(p => {
      const staffNames = p.staff.map(s => s.name).join(', ')
      console.log(`  ${p.name} (${p.id}) - スタッフ: ${staffNames || 'なし'}`)
    })

    // 名前ごとにグループ化して重複を検出
    const nameGroups = new Map()
    for (const p of positions) {
      if (!nameGroups.has(p.name)) {
        nameGroups.set(p.name, [])
      }
      nameGroups.get(p.name).push(p)
    }

    let deletedCount = 0
    for (const [name, group] of nameGroups) {
      if (group.length <= 1) continue

      console.log(`\n重複検出: ${name} (${group.length}件)`)

      // スタッフが紐づいているものを優先的に残す
      const withStaff = group.filter(p => p.staff.length > 0)
      const keepId = withStaff.length > 0 ? withStaff[0].id : group[0].id

      for (const p of group) {
        if (p.id === keepId) {
          console.log(`  保持: ${p.id} (スタッフ: ${p.staff.length}名)`)
          continue
        }

        if (p.staff.length > 0) {
          // スタッフを保持するものに移動
          for (const s of p.staff) {
            await prisma.staff.update({
              where: { id: s.id },
              data: { position_id: keepId }
            })
            console.log(`  スタッフ ${s.name} を移動: ${p.id} → ${keepId}`)
          }
        }

        await prisma.staff_positions.delete({ where: { id: p.id } })
        console.log(`  削除: ${p.id}`)
        deletedCount++
      }
    }

    console.log(`\n✓ ${deletedCount}件の重複を削除`)

    // 最終確認
    const finalPositions = await prisma.staff_positions.findMany({
      where: { clinic_id: REAL_CLINIC_ID },
      orderBy: { sort_order: 'asc' }
    })
    console.log(`\n最終結果: ${finalPositions.length}件`)
    finalPositions.forEach(p => console.log(`  ${p.sort_order}. ${p.name}`))

    console.log('\n✅ 完了')
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
main()
