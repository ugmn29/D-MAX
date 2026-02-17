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

// メニュー名ごとのデフォルト色
const colorMap = {
  '定期検診': '#10B981',   // 緑
  '一般歯科': '#3B82F6',   // 青
  '虫歯治療': '#F59E0B',   // 黄
  '歯周病治療': '#EF4444', // 赤
}

const DEFAULT_COLOR = '#6B7280' // グレー（不明メニュー用）

async function main() {
  try {
    const menus = await prisma.treatment_menus.findMany()

    for (const menu of menus) {
      if (!menu.color) {
        const color = colorMap[menu.name] || DEFAULT_COLOR
        await prisma.treatment_menus.update({
          where: { id: menu.id },
          data: { color }
        })
        console.log(`✓ ${menu.name}: ${color}`)
      } else {
        console.log(`⏭ ${menu.name}: 既に ${menu.color}`)
      }
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
