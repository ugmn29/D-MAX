/**
 * Staff API Route (Individual Staff) - Prisma版
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
    const { id: staffId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    console.log('スタッフ更新リクエスト:', { staffId, clinicId })

    if (!clinicId || !staffId) {
      console.error('バリデーションエラー: clinic_idまたはstaff idが不足')
      return NextResponse.json(
        { error: 'clinic_id and staff id are required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('更新データ:', body)

    const updatedStaff = await prisma.staff.update({
      where: {
        id: staffId,
        clinic_id: clinicId
      },
      data: {
        ...body,
        updated_at: new Date()
      },
      include: {
        staff_positions: {
          select: {
            id: true,
            name: true,
            sort_order: true,
            clinic_id: true,
            created_at: true
          }
        }
      }
    })

    console.log('スタッフ更新成功:', updatedStaff.id)

    const result = {
      id: updatedStaff.id,
      name: updatedStaff.name,
      name_kana: updatedStaff.name_kana || undefined,
      email: updatedStaff.email || undefined,
      phone: updatedStaff.phone || undefined,
      position_id: updatedStaff.position_id || undefined,
      role: updatedStaff.role || 'staff',
      is_active: updatedStaff.is_active ?? true,
      created_at: convertToDate(updatedStaff.created_at).toISOString(),
      updated_at: convertToDate(updatedStaff.updated_at).toISOString(),
      clinic_id: updatedStaff.clinic_id,
      position: updatedStaff.staff_positions ? {
        id: updatedStaff.staff_positions.id,
        name: updatedStaff.staff_positions.name,
        sort_order: updatedStaff.staff_positions.sort_order,
        clinic_id: updatedStaff.staff_positions.clinic_id,
        created_at: convertToDate(updatedStaff.staff_positions.created_at).toISOString(),
        updated_at: convertToDate(updatedStaff.staff_positions.created_at).toISOString()
      } : undefined
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('スタッフ更新エラー:', error)
    console.error('エラー詳細:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      {
        error: 'スタッフの更新に失敗しました',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId || !staffId) {
      return NextResponse.json(
        { error: 'clinic_id and staff id are required' },
        { status: 400 }
      )
    }

    // 論理削除
    await prisma.staff.update({
      where: {
        id: staffId,
        clinic_id: clinicId
      },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('スタッフ削除エラー:', error)
    console.error('エラー詳細:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      {
        error: 'スタッフの削除に失敗しました',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}
