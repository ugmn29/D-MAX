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

async function dedupeQuestionnaire(questionnaireId, name) {
  const questions = await prisma.questionnaire_questions.findMany({
    where: { questionnaire_id: questionnaireId },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }]
  })

  // question_text + section_name でグループ化
  const groups = new Map()
  for (const q of questions) {
    const key = `${q.section_name}||${q.question_text}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(q)
  }

  const deleteIds = []
  for (const [key, items] of groups) {
    if (items.length > 1) {
      // 最初の1件を残し、残りを削除
      for (let i = 1; i < items.length; i++) {
        deleteIds.push(items[i].id)
      }
    }
  }

  if (deleteIds.length > 0) {
    await prisma.questionnaire_questions.deleteMany({
      where: { id: { in: deleteIds } }
    })
    console.log(`✓ ${name}: ${deleteIds.length}件の重複質問を削除 (${questions.length} → ${questions.length - deleteIds.length})`)
  } else {
    console.log(`⏭ ${name}: 重複なし`)
  }
}

async function main() {
  try {
    console.log('🧹 問診票の重複質問を削除中...\n')

    const questionnaires = await prisma.questionnaires.findMany()
    for (const q of questionnaires) {
      await dedupeQuestionnaire(q.id, q.name)
    }

    console.log('\n✅ 完了')
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
main()
