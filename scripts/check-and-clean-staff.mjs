import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// .env.localファイルを読み込む
const envPath = path.join(__dirname, '../.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

// 環境変数を設定
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('📊 スタッフデータを確認中...\n')

    // 全スタッフを取得
    const allStaff = await prisma.staff.findMany({
      include: {
        staff_positions: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    console.log(`合計 ${allStaff.length} 件のスタッフが登録されています\n`)

    if (allStaff.length === 0) {
      console.log('スタッフデータがありません。')
      return
    }

    allStaff.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name} (${staff.name_kana || 'かな未設定'})`)
      console.log(`   ID: ${staff.id}`)
      console.log(`   Clinic ID: ${staff.clinic_id}`)
      console.log(`   役職: ${staff.staff_positions?.name || '未設定'}`)
      console.log(`   権限: ${staff.role}`)
      console.log(`   アクティブ: ${staff.is_active}`)
      console.log(`   作成日時: ${staff.created_at}`)
      console.log('')
    })

    // 役職も確認
    const positions = await prisma.staff_positions.findMany({
      orderBy: {
        sort_order: 'asc'
      }
    })

    console.log(`\n📋 登録されている役職 (${positions.length}件):`)
    positions.forEach((pos, index) => {
      console.log(`${index + 1}. ${pos.name}`)
      console.log(`   ID: ${pos.id}`)
      console.log(`   Clinic ID: ${pos.clinic_id}`)
      console.log(`   Sort Order: ${pos.sort_order}`)
      console.log(`   作成日時: ${pos.created_at}`)
      console.log('')
    })

    // ユーザーに削除対象を選択させる
    console.log('\n=== 削除オプション ===')
    console.log('1. 特定のClinic IDのスタッフを全て削除')
    console.log('2. デフォルトのテストデータを削除（clinic_id = "11111111-1111-1111-1111-111111111111"）')
    console.log('3. 全てのスタッフを削除')
    console.log('4. キャンセル')

    // 対話的な入力の代わりに、デフォルトのクリニックIDのスタッフを表示
    const defaultClinicId = '11111111-1111-1111-1111-111111111111'
    const defaultStaff = allStaff.filter(s => s.clinic_id === defaultClinicId)

    if (defaultStaff.length > 0) {
      console.log(`\n⚠️  デフォルトクリニック (${defaultClinicId}) のスタッフが ${defaultStaff.length} 件見つかりました:`)
      defaultStaff.forEach((staff, index) => {
        console.log(`  ${index + 1}. ${staff.name}`)
      })

      console.log('\nこれらを削除する場合は、以下のコマンドを実行してください:')
      console.log('node scripts/clean-default-staff.mjs')
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
