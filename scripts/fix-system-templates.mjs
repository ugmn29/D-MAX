/**
 * システムテンプレートデータを元のマイグレーションに合わせて修正
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
    console.log('🔧 システムテンプレートを元のデータに修正中...\n')

    // === キャンセル理由テンプレート: 全削除して元の4件を投入 ===
    await prisma.system_cancel_reasons.deleteMany({})
    console.log('✓ 既存のキャンセル理由テンプレートを削除')

    const cancelReasonTemplates = [
      { id: '00000000-0000-0000-0002-000000000001', name: '無断キャンセル', description: '連絡なしでのキャンセル', sort_order: 1, is_active: true },
      { id: '00000000-0000-0000-0002-000000000002', name: '事前連絡', description: '事前に連絡があったキャンセル', sort_order: 2, is_active: true },
      { id: '00000000-0000-0000-0002-000000000003', name: '当日キャンセル', description: '当日のキャンセル', sort_order: 3, is_active: true },
      { id: '00000000-0000-0000-0002-000000000004', name: '医院都合', description: '医院側の都合によるキャンセル', sort_order: 4, is_active: true },
    ]

    for (const template of cancelReasonTemplates) {
      await prisma.system_cancel_reasons.create({ data: template })
    }
    console.log(`✓ キャンセル理由テンプレート: ${cancelReasonTemplates.length}件 作成（元のデータ）`)

    // === スタッフ役職テンプレート: 全削除して元の4件を投入 ===
    await prisma.system_staff_positions.deleteMany({})
    console.log('✓ 既存のスタッフ役職テンプレートを削除')

    const staffPositionTemplates = [
      { id: '00000000-0000-0000-0001-000000000001', name: '歯科医師', sort_order: 1, is_active: true },
      { id: '00000000-0000-0000-0001-000000000002', name: '歯科衛生士', sort_order: 2, is_active: true },
      { id: '00000000-0000-0000-0001-000000000003', name: '歯科助手', sort_order: 3, is_active: true },
      { id: '00000000-0000-0000-0001-000000000004', name: '受付', sort_order: 4, is_active: true },
    ]

    for (const template of staffPositionTemplates) {
      await prisma.system_staff_positions.create({ data: template })
    }
    console.log(`✓ スタッフ役職テンプレート: ${staffPositionTemplates.length}件 作成（元のデータ）`)

    // === フォールバックIDで作られたゴミデータを削除 ===
    const fallbackClinicId = '11111111-1111-1111-1111-111111111111'

    const deletedCancelReasons = await prisma.cancel_reasons.deleteMany({
      where: { clinic_id: fallbackClinicId }
    })
    if (deletedCancelReasons.count > 0) {
      console.log(`✓ フォールバックclinic_idのキャンセル理由を${deletedCancelReasons.count}件削除`)
    }

    const deletedPositions = await prisma.staff_positions.deleteMany({
      where: { clinic_id: fallbackClinicId }
    })
    if (deletedPositions.count > 0) {
      console.log(`✓ フォールバックclinic_idのスタッフ役職を${deletedPositions.count}件削除`)
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
