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

    console.log('🔍 重複した役職を確認中...\n')

    // 全ての役職を取得
    const positions = await prisma.staff_positions.findMany({
      where: {
        clinic_id: defaultClinicId
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    console.log(`✓ スタッフ役職総数: ${positions.length}件\n`)

    // 役職名でグループ化
    const groupedByName = {}
    positions.forEach(pos => {
      if (!groupedByName[pos.name]) {
        groupedByName[pos.name] = []
      }
      groupedByName[pos.name].push(pos)
    })

    // 重複を確認
    for (const [name, posArray] of Object.entries(groupedByName)) {
      if (posArray.length > 1) {
        console.log(`⚠️  重複: "${name}" - ${posArray.length}件`)

        // 最も古いものを残す
        const keepPosition = posArray[0]
        const deletePositions = posArray.slice(1)

        console.log(`  保持: ${keepPosition.id} (作成日: ${keepPosition.created_at})`)

        for (const delPos of deletePositions) {
          console.log(`  削除: ${delPos.id} (作成日: ${delPos.created_at})`)
          await prisma.staff_positions.delete({
            where: { id: delPos.id }
          })
        }

        console.log(`  ✅ ${deletePositions.length}件の重複を削除しました\n`)
      }
    }

    // 最終確認
    const finalPositions = await prisma.staff_positions.findMany({
      where: { clinic_id: defaultClinicId }
    })

    console.log(`\n📊 クリーンアップ後のスタッフ役職: ${finalPositions.length}件`)
    finalPositions.forEach(pos => {
      console.log(`  - ${pos.name}`)
    })

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
