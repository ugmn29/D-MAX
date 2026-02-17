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

const QUESTIONNAIRE_ID = '11111111-1111-1111-1111-111111111112'

async function main() {
  try {
    const questions = await prisma.questionnaire_questions.findMany({
      where: { questionnaire_id: QUESTIONNAIRE_ID },
      orderBy: { sort_order: 'asc' }
    })

    console.log(`標準問診表の質問数: ${questions.length}件\n`)

    // 重複チェック: question_text + section_name でグループ化
    const groups = new Map()
    for (const q of questions) {
      const key = `${q.section_name}||${q.question_text}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(q)
    }

    let dupeCount = 0
    for (const [key, items] of groups) {
      if (items.length > 1) {
        dupeCount++
        console.log(`重複 (${items.length}件): ${key.substring(0, 80)}`)
        items.forEach(q => console.log(`  ID: ${q.id} | sort: ${q.sort_order}`))
      }
    }

    if (dupeCount === 0) {
      console.log('重複なし')
    } else {
      console.log(`\n合計 ${dupeCount} グループの重複あり`)

      // ユニークな質問数
      const uniqueCount = groups.size
      console.log(`ユニーク質問数: ${uniqueCount}`)
      console.log(`削除対象: ${questions.length - uniqueCount}件`)
    }
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
main()
