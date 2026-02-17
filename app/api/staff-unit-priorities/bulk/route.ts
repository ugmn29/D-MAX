import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * PUT /api/staff-unit-priorities/bulk?clinic_id=xxx&staff_id=xxx
 * スタッフユニット優先順位を一括更新
 */
export async function PUT(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const staffId = searchParams.get('staff_id')

    if (!clinicId || !staffId) {
      return NextResponse.json(
        { error: 'clinic_id and staff_id are required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { priorities } = body

    if (!Array.isArray(priorities)) {
      return NextResponse.json(
        { error: 'priorities must be an array' },
        { status: 400 }
      )
    }

    // トランザクションで既存データを削除 + 新規データを挿入
    await prisma.$transaction(async (tx) => {
      // 既存の優先順位を削除
      await tx.staff_unit_priorities.deleteMany({
        where: {
          clinic_id: clinicId,
          staff_id: staffId
        }
      })

      // 新しい優先順位を作成
      if (priorities.length > 0) {
        const insertData = priorities.map((p: any) => ({
          clinic_id: clinicId,
          staff_id: staffId,
          unit_id: p.unitId,
          priority_order: p.priorityOrder,
          is_active: true
        }))

        await tx.staff_unit_priorities.createMany({
          data: insertData
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('スタッフユニット優先順位一括更新エラー:', error)
    return NextResponse.json(
      { error: 'スタッフユニット優先順位の一括更新に失敗しました' },
      { status: 500 }
    )
  }
}
