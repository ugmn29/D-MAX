import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * PUT /api/units/[id]?clinic_id=xxx
 * ユニットを更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params
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
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const unit = await prisma.units.update({
      where: {
        id: unitId,
        clinic_id: clinicId
      },
      data: updateData
    })

    const unitWithStringDates = convertDatesToStrings(unit, ['created_at', 'updated_at'])

    return NextResponse.json(unitWithStringDates)
  } catch (error) {
    console.error('ユニット更新エラー:', error)
    return NextResponse.json(
      { error: 'ユニットの更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/units/[id]?clinic_id=xxx
 * ユニットを削除（予約がある場合はエラー）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // 既存予約の確認
    const appointmentCount = await prisma.appointments.count({
      where: {
        clinic_id: clinicId,
        unit_id: unitId
      }
    })

    if (appointmentCount > 0) {
      return NextResponse.json(
        { error: 'このユニットに関連する予約が存在するため削除できません' },
        { status: 400 }
      )
    }

    await prisma.units.delete({
      where: {
        id: unitId,
        clinic_id: clinicId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ユニット削除エラー:', error)
    return NextResponse.json(
      { error: 'ユニットの削除に失敗しました' },
      { status: 500 }
    )
  }
}
