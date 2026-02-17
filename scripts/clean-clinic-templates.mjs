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
    console.log('🧹 実クリニックの誤ったテンプレートデータを削除中...\n')

    // 誤って作成された9件のキャンセル理由を削除
    const deletedReasons = await prisma.cancel_reasons.deleteMany({
      where: { clinic_id: REAL_CLINIC_ID }
    })
    console.log(`✓ キャンセル理由: ${deletedReasons.count}件 削除`)

    // 重複した歯科医師のスタッフ役職を削除
    const deletedPositions = await prisma.staff_positions.deleteMany({
      where: { clinic_id: REAL_CLINIC_ID }
    })
    console.log(`✓ スタッフ役職: ${deletedPositions.count}件 削除`)

    console.log('\n次にマスター設定ページを開くと、正しい4件ずつが自動初期化されます')
    console.log('✅ 完了')
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
main()
