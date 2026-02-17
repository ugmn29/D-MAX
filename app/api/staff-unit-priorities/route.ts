import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/staff-unit-priorities?clinic_id=xxx&staff_id=xxx
 * スタッフユニット優先順位一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const staffId = searchParams.get('staff_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const where: any = {
      clinic_id: clinicId,
      is_active: true
    }

    if (staffId) {
      where.staff_id = staffId
    }

    const priorities = await prisma.staff_unit_priorities.findMany({
      where,
      orderBy: {
        priority_order: 'asc'
      },
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

    // データの整形（staff/unitsをflat化）
    const enrichedPriorities = priorities.map(p => ({
      ...convertDatesToStrings(p, ['created_at', 'updated_at']),
      staff: p.staff ? { id: p.staff.id, name: p.staff.name } : undefined,
      unit: p.units ? { id: p.units.id, name: p.units.name } : undefined
    }))

    return NextResponse.json(enrichedPriorities)
  } catch (error) {
    console.error('スタッフユニット優先順位取得エラー:', error)
    // テーブルが存在しない可能性があるため、空配列を返す
    return NextResponse.json([])
  }
}

/**
 * POST /api/staff-unit-priorities?clinic_id=xxx
 * スタッフユニット優先順位を作成
 */
export async function POST(request: NextRequest) {
  try {
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
    const { staff_id, unit_id, priority_order, is_active } = body

    if (!staff_id || !unit_id || priority_order === undefined) {
      return NextResponse.json(
        { error: 'staff_id, unit_id, priority_orderは必須です' },
        { status: 400 }
      )
    }

    const priority = await prisma.staff_unit_priorities.create({
      data: {
        clinic_id: clinicId,
        staff_id,
        unit_id,
        priority_order,
        is_active: is_active !== undefined ? is_active : true
      },
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
    console.error('スタッフユニット優先順位作成エラー:', error)
    return NextResponse.json(
      { error: 'スタッフユニット優先順位の作成に失敗しました' },
      { status: 500 }
    )
  }
}
