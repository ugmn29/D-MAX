/**
 * システムテンプレートデータの投入スクリプト
 * system_cancel_reasons と system_staff_positions にデフォルトデータを作成
 */

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
    console.log('🌱 システムテンプレートデータを投入中...\n')

    // === キャンセル理由テンプレート ===
    const existingCancelReasons = await prisma.system_cancel_reasons.count()
    if (existingCancelReasons === 0) {
      const cancelReasonTemplates = [
        { name: '患者都合', description: '患者様のご都合によるキャンセル', sort_order: 1 },
        { name: '体調不良', description: '患者様の体調不良によるキャンセル', sort_order: 2 },
        { name: '仕事・学校', description: '仕事や学校の都合によるキャンセル', sort_order: 3 },
        { name: '家庭の事情', description: '家庭の事情によるキャンセル', sort_order: 4 },
        { name: '天候不良', description: '天候不良によるキャンセル', sort_order: 5 },
        { name: '交通事情', description: '交通事情によるキャンセル', sort_order: 6 },
        { name: '無断キャンセル', description: '連絡なしのキャンセル', sort_order: 7 },
        { name: '医院都合', description: '医院側の都合によるキャンセル', sort_order: 8 },
        { name: 'その他', description: 'その他の理由', sort_order: 9 },
      ]

      for (const template of cancelReasonTemplates) {
        await prisma.system_cancel_reasons.create({ data: template })
      }
      console.log(`✓ キャンセル理由テンプレート: ${cancelReasonTemplates.length}件 作成`)
    } else {
      console.log(`⏭ キャンセル理由テンプレート: 既に${existingCancelReasons}件あり（スキップ）`)
    }

    // === スタッフ役職テンプレート ===
    const existingStaffPositions = await prisma.system_staff_positions.count()
    if (existingStaffPositions === 0) {
      const staffPositionTemplates = [
        { name: '院長', sort_order: 1 },
        { name: '歯科医師', sort_order: 2 },
        { name: '歯科衛生士', sort_order: 3 },
        { name: '歯科助手', sort_order: 4 },
        { name: '受付', sort_order: 5 },
        { name: 'その他', sort_order: 6 },
      ]

      for (const template of staffPositionTemplates) {
        await prisma.system_staff_positions.create({ data: template })
      }
      console.log(`✓ スタッフ役職テンプレート: ${staffPositionTemplates.length}件 作成`)
    } else {
      console.log(`⏭ スタッフ役職テンプレート: 既に${existingStaffPositions}件あり（スキップ）`)
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
