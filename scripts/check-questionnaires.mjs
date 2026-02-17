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

async function main() {
  try {
    const questionnaires = await prisma.questionnaires.findMany({
      include: {
        questionnaire_questions: { select: { id: true } }
      }
    })
    console.log(`問診票: ${questionnaires.length}件\n`)
    questionnaires.forEach(q => {
      console.log(`  ID: ${q.id}`)
      console.log(`  名前: ${q.name}`)
      console.log(`  clinic_id: ${q.clinic_id}`)
      console.log(`  active: ${q.is_active}`)
      console.log(`  質問数: ${q.questionnaire_questions.length}`)
      console.log('')
    })
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
main()
