/**
 * Staff Positions API Route (Individual Position) - Prisma版
 * サーバーサイド専用
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { convertToDate } from '@/lib/prisma/helpers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: positionId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId || !positionId) {
      return NextResponse.json(
        { error: 'clinic_id and position id are required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order
    if (body.template_id !== undefined) updateData.template_id = body.template_id

    const updatedPosition = await prisma.staff_positions.update({
      where: {
        id: positionId,
        clinic_id: clinicId
      },
      data: updateData
    })

    const result = {
      id: updatedPosition.id,
      name: updatedPosition.name,
      sort_order: updatedPosition.sort_order,
      clinic_id: updatedPosition.clinic_id,
      created_at: convertToDate(updatedPosition.created_at).toISOString(),
      updated_at: convertToDate(updatedPosition.created_at).toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('スタッフ役職更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: positionId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId || !positionId) {
      return NextResponse.json(
        { error: 'clinic_id and position id are required' },
        { status: 400 }
      )
    }

    // この役職を使用しているスタッフがいないか確認
    const staffCount = await prisma.staff.count({
      where: {
        position_id: positionId,
        clinic_id: clinicId
      }
    })

    if (staffCount > 0) {
      return NextResponse.json(
        { error: `この役職は${staffCount}名のスタッフに設定されているため削除できません。先にスタッフの役職を変更してください。` },
        { status: 400 }
      )
    }

    await prisma.staff_positions.delete({
      where: {
        id: positionId,
        clinic_id: clinicId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('スタッフ役職削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
