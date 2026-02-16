import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * PUT /api/staff-unit-priorities/[id]?clinic_id=xxx
 * スタッフユニット優先順位を更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: priorityId } = await params
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updateData: any = {
      updated_at: new Date()
    }

    if (body.priority_order !== undefined) updateData.priority_order = body.priority_order
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const priority = await prisma.staff_unit_priorities.update({
      where: {
        id: priorityId,
        clinic_id: clinicId
      },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            name: true
          }
        },
        units: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const enrichedPriority = {
      ...convertDatesToStrings(priority, ['created_at', 'updated_at']),
      staff: priority.staff ? { id: priority.staff.id, name: priority.staff.name } : undefined,
      unit: priority.units ? { id: priority.units.id, name: priority.units.name } : undefined
    }

    return NextResponse.json(enrichedPriority)
  } catch (error) {
    console.error('スタッフユニット優先順位更新エラー:', error)
    return NextResponse.json(
      { error: 'スタッフユニット優先順位の更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/staff-unit-priorities/[id]?clinic_id=xxx
 * スタッフユニット優先順位を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: priorityId } = await params
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    await prisma.staff_unit_priorities.delete({
      where: {
        id: priorityId,
        clinic_id: clinicId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('スタッフユニット優先順位削除エラー:', error)
    return NextResponse.json(
      { error: 'スタッフユニット優先順位の削除に失敗しました' },
      { status: 500 }
    )
  }
}
