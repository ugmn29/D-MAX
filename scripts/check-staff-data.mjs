import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStaffData() {
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
      console.log(`${index + 1}. ${pos.name} (ID: ${pos.id}, sort_order: ${pos.sort_order})`)
    })

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStaffData()
