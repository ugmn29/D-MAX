/**
 * Staff API Route - Prisma版
 * サーバーサイド専用
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { convertToDate } from '@/lib/prisma/helpers'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    console.log('スタッフ作成リクエスト:', { clinicId })

    if (!clinicId) {
      console.error('バリデーションエラー: clinic_idが不足')
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('作成データ:', body)

    const newStaff = await prisma.staff.create({
      data: {
        ...body,
        clinic_id: clinicId,
        is_active: body.is_active ?? true
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

    console.log('スタッフ作成成功:', newStaff.id)

    const result = {
      id: newStaff.id,
      name: newStaff.name,
      name_kana: newStaff.name_kana || undefined,
      email: newStaff.email || undefined,
      phone: newStaff.phone || undefined,
      position_id: newStaff.position_id || undefined,
      role: newStaff.role || 'staff',
      is_active: newStaff.is_active ?? true,
      created_at: convertToDate(newStaff.created_at).toISOString(),
      updated_at: convertToDate(newStaff.updated_at).toISOString(),
      clinic_id: newStaff.clinic_id,
      position: newStaff.staff_positions ? {
        id: newStaff.staff_positions.id,
        name: newStaff.staff_positions.name,
        sort_order: newStaff.staff_positions.sort_order,
        clinic_id: newStaff.staff_positions.clinic_id,
        created_at: convertToDate(newStaff.staff_positions.created_at).toISOString(),
        updated_at: convertToDate(newStaff.staff_positions.created_at).toISOString()
      } : undefined
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('スタッフ作成エラー:', error)
    console.error('エラー詳細:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      {
        error: 'スタッフの作成に失敗しました',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const activeOnly = searchParams.get('active_only') !== 'false'

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const staffList = await prisma.staff.findMany({
      where: {
        clinic_id: clinicId,
        ...(activeOnly ? { is_active: true } : {})
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
      },
      orderBy: {
        name: 'asc'
      }
    })

    const staff = staffList.map(s => ({
      id: s.id,
      name: s.name,
      name_kana: s.name_kana || undefined,
      email: s.email || undefined,
      phone: s.phone || undefined,
      position_id: s.position_id || undefined,
      role: s.role || 'staff',
      is_active: s.is_active ?? true,
      created_at: convertToDate(s.created_at).toISOString(),
      updated_at: convertToDate(s.updated_at).toISOString(),
      clinic_id: s.clinic_id,
      position: s.staff_positions ? {
        id: s.staff_positions.id,
        name: s.staff_positions.name,
        sort_order: s.staff_positions.sort_order,
        clinic_id: s.staff_positions.clinic_id,
        created_at: convertToDate(s.staff_positions.created_at).toISOString(),
        updated_at: convertToDate(s.staff_positions.created_at).toISOString()
      } : undefined
    }))

    return NextResponse.json(staff)
  } catch (error) {
    console.error('スタッフ取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
