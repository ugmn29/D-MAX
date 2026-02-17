import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
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

// Prisma 7のクライアント初期化
const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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
      await prisma.$disconnect()
      await pool.end()
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

    // デフォルトのクリニックIDのスタッフを特定
    const defaultClinicId = '11111111-1111-1111-1111-111111111111'
    const defaultStaff = allStaff.filter(s => s.clinic_id === defaultClinicId)

    if (defaultStaff.length > 0) {
      console.log(`\n⚠️  デフォルトクリニック (${defaultClinicId}) のスタッフが ${defaultStaff.length} 件見つかりました:`)
      defaultStaff.forEach((staff, index) => {
        console.log(`  ${index + 1}. ${staff.name} (ID: ${staff.id})`)
      })

      console.log('\n削除しますか? (y/n)')
      console.log('※ 削除する場合は、以下のコマンドを実行してください:')
      console.log('node scripts/clean-staff.mjs --delete-default')
    }

    // --delete-default フラグがある場合は削除
    if (process.argv.includes('--delete-default')) {
      console.log('\n🗑️  デフォルトクリニックのスタッフを削除中...')

      const deletedCount = await prisma.staff.deleteMany({
        where: {
          clinic_id: defaultClinicId
        }
      })

      console.log(`✅ ${deletedCount.count} 件のスタッフを削除しました`)
    }

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
