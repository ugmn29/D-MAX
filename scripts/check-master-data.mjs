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
    console.log('📊 マスタデータの状況を確認中...\n')

    // 問診票テンプレート（システム）
    const systemQuestionnaireTemplates = await prisma.system_questionnaire_templates.count()
    console.log(`✓ 問診票テンプレート（システム）: ${systemQuestionnaireTemplates}件`)

    // 問診票（クリニック固有）
    const questionnaires = await prisma.questionnaires.count()
    console.log(`✓ 問診票（クリニック固有）: ${questionnaires}件`)

    // キャンセル理由（システム）
    const systemCancelReasons = await prisma.system_cancel_reasons.count()
    console.log(`✓ キャンセル理由（システム）: ${systemCancelReasons}件`)

    // キャンセル理由（クリニック固有）
    const cancelReasons = await prisma.cancel_reasons.count()
    console.log(`✓ キャンセル理由（クリニック固有）: ${cancelReasons}件`)

    // メモテンプレート
    const memoTemplates = await prisma.memo_templates.count()
    console.log(`✓ メモテンプレート: ${memoTemplates}件`)

    // 患者メモタイプ
    const patientNoteTypes = await prisma.patient_note_types.count()
    console.log(`✓ 患者メモタイプ: ${patientNoteTypes}件`)

    // スタッフ役職（システムテンプレート）
    const systemStaffPositions = await prisma.system_staff_positions.count()
    console.log(`✓ スタッフ役職テンプレート: ${systemStaffPositions}件`)

    // 診療メニュー
    const treatmentMenus = await prisma.treatment_menus.count()
    console.log(`✓ 診療メニュー: ${treatmentMenus}件`)

    // トラッキングタグ
    const trackingTags = await prisma.tracking_tags.count()
    console.log(`✓ トラッキングタグ: ${trackingTags}件`)

    console.log('\n=== 推奨される引き継ぎ対象 ===')
    console.log('以下のマスタデータは新規クリニックでも使用できる共通データです:')
    console.log('1. 問診票テンプレート（質問内容の雛形）')
    console.log('2. 診療メニューテンプレート（施術内容の雛形）')
    console.log('3. キャンセル理由（よくあるキャンセル理由）')
    console.log('4. メモテンプレート（よく使う定型文）')
    console.log('5. 患者メモタイプ（メモの分類）')
    console.log('6. スタッフ役職テンプレート（デフォルトの役職リスト）')
    console.log('7. トラッキングタグマスタ（患者の特記事項アイコン）')

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
