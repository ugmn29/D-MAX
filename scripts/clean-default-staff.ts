/**
 * デフォルトのテストスタッフデータを削除するスクリプト
 *
 * 使用方法:
 * 1. 削除対象のクリニックIDを確認
 * 2. npx tsx scripts/clean-default-staff.ts を実行
 */

import { prisma } from '../lib/prisma/client'

// 削除対象のクリニックID（デフォルトのテストクリニック）
const DEFAULT_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

async function cleanDefaultStaff() {
  try {
    console.log('🗑️  デフォルトスタッフデータの削除を開始します...\n')

    // 削除前にデータを確認
    const staffToDelete = await prisma.staff.findMany({
      where: {
        clinic_id: DEFAULT_CLINIC_ID
      },
      include: {
        staff_positions: true
      }
    })

    if (staffToDelete.length === 0) {
      console.log(`クリニックID ${DEFAULT_CLINIC_ID} のスタッフデータは見つかりませんでした。`)
      return
    }

    console.log(`以下の ${staffToDelete.length} 件のスタッフを削除します:`)
    staffToDelete.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} (${staff.name_kana || 'かな未設定'}) - 役職: ${staff.staff_positions?.name || '未設定'}`)
    })

    console.log('\n削除を実行します...')

    // スタッフを削除
    const deleteResult = await prisma.staff.deleteMany({
      where: {
        clinic_id: DEFAULT_CLINIC_ID
      }
    })

    console.log(`✅ ${deleteResult.count} 件のスタッフを削除しました。`)

    // 役職も削除するか確認
    const positionsToDelete = await prisma.staff_positions.findMany({
      where: {
        clinic_id: DEFAULT_CLINIC_ID
      }
    })

    if (positionsToDelete.length > 0) {
      console.log(`\n${positionsToDelete.length} 件の役職も見つかりました:`)
      positionsToDelete.forEach((pos, index) => {
        console.log(`  ${index + 1}. ${pos.name}`)
      })

      console.log('\n役職も削除します...')
      const deletePositionsResult = await prisma.staff_positions.deleteMany({
        where: {
          clinic_id: DEFAULT_CLINIC_ID
        }
      })

      console.log(`✅ ${deletePositionsResult.count} 件の役職を削除しました。`)
    }

    console.log('\n🎉 クリーンアップが完了しました！')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプトを実行
cleanDefaultStaff()
