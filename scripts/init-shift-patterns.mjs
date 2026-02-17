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

    console.log('📋 シフトパターンを初期化中...\n')

    // 既存のシフトパターンをチェック
    const existingPatterns = await prisma.shift_patterns.findMany({
      where: {
        clinic_id: defaultClinicId
      }
    })

    console.log(`既存のシフトパターン: ${existingPatterns.length}件`)

    if (existingPatterns.length > 0) {
      console.log('既存のパターン:')
      existingPatterns.forEach(p => {
        console.log(`  - ${p.abbreviation}: ${p.name} (${p.start_time || '---'} - ${p.end_time || '---'})`)
      })
      console.log()
    }

    const existingKeys = new Set(
      existingPatterns.map(p => `${p.abbreviation}:${p.name}`)
    )

    // デフォルトのシフトパターン
    // 注: 「休み」はシフトパターンではなく、shift_pattern_id を null にすることで表現
    const defaultPatterns = [
      {
        clinic_id: defaultClinicId,
        abbreviation: '日',
        name: '日勤',
        start_time: new Date('1970-01-01T09:00:00.000Z'),
        end_time: new Date('1970-01-01T18:00:00.000Z'),
        break_start: new Date('1970-01-01T12:00:00.000Z'),
        break_end: new Date('1970-01-01T13:00:00.000Z')
      },
      {
        clinic_id: defaultClinicId,
        abbreviation: '遅',
        name: '遅番',
        start_time: new Date('1970-01-01T12:00:00.000Z'),
        end_time: new Date('1970-01-01T21:00:00.000Z'),
        break_start: new Date('1970-01-01T15:00:00.000Z'),
        break_end: new Date('1970-01-01T16:00:00.000Z')
      }
    ]

    // 重複しないものだけフィルタリング
    const newPatterns = defaultPatterns.filter(
      p => !existingKeys.has(`${p.abbreviation}:${p.name}`)
    )

    if (newPatterns.length === 0) {
      console.log('✓ すべてのシフトパターンが既に存在します')
      return
    }

    console.log(`新規作成するシフトパターン: ${newPatterns.length}件\n`)

    for (const pattern of newPatterns) {
      const created = await prisma.shift_patterns.create({
        data: pattern
      })
      console.log(`✅ ${created.abbreviation}: ${created.name} を作成しました`)
    }

    console.log(`\n✨ ${newPatterns.length}件のシフトパターンを作成しました (${defaultPatterns.length - newPatterns.length}件スキップ)`)

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
