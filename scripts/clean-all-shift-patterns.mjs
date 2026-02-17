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
    console.log('📋 すべてのシフトパターンを確認中...\n')

    // すべてのシフトパターンを取得
    const allPatterns = await prisma.shift_patterns.findMany({
      orderBy: [
        { clinic_id: 'asc' },
        { abbreviation: 'asc' }
      ]
    })

    console.log(`合計: ${allPatterns.length}件のシフトパターン\n`)

    if (allPatterns.length === 0) {
      console.log('⚠️  シフトパターンが1件も登録されていません')
      return
    }

    // クリニックごとにグループ化して表示
    const byClinic = {}
    allPatterns.forEach(p => {
      if (!byClinic[p.clinic_id]) {
        byClinic[p.clinic_id] = []
      }
      byClinic[p.clinic_id].push(p)
    })

    for (const [clinicId, patterns] of Object.entries(byClinic)) {
      console.log(`クリニック ID: ${clinicId}`)
      patterns.forEach(p => {
        console.log(`  - ${p.abbreviation}: ${p.name} (${p.start_time || '---'} - ${p.end_time || '---'})`)
        console.log(`    ID: ${p.id}`)
      })
      console.log()
    }

    // すべて削除
    console.log('🗑️  すべてのシフトパターンを削除中...\n')

    const deleteResult = await prisma.shift_patterns.deleteMany({})

    console.log(`✅ ${deleteResult.count}件のシフトパターンを削除しました`)
    console.log('\n✨ クリーンアップ完了')

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
