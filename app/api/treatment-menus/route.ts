import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertArrayDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/treatment-menus?clinic_id=xxx
 * 診療メニュー一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'クリニックIDは必須です' },
        { status: 400 }
      )
    }

    const menus = await prisma.treatment_menus.findMany({
      where: { clinic_id },
      orderBy: [
        { level: 'asc' },
        { sort_order: 'asc' },
        { name: 'asc' }
      ]
    })

    const result = convertArrayDatesToStrings(menus, ['created_at'])

    return NextResponse.json(result)
  } catch (error) {
    console.error('診療メニュー取得エラー:', error)
    return NextResponse.json(
      { error: '診療メニューの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/treatment-menus
 * 診療メニューを新規作成
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()

    const { clinic_id, name, level, parent_id, standard_duration, color, sort_order, is_active, web_booking_enabled, web_booking_staff_ids, web_booking_duration, web_booking_new_patient, web_booking_returning } = body

    if (!clinic_id || !name || level === undefined) {
      return NextResponse.json(
        { error: 'clinic_id、name、levelは必須です' },
        { status: 400 }
      )
    }

    const menu = await prisma.treatment_menus.create({
      data: {
        clinic_id,
        name,
        level,
        parent_id: parent_id || null,
        standard_duration: standard_duration || null,
        color: color || null,
        sort_order: sort_order ?? 0,
        is_active: is_active ?? true,
        web_booking_enabled: web_booking_enabled ?? false,
        web_booking_staff_ids: web_booking_staff_ids || [],
        web_booking_duration: web_booking_duration || null,
        web_booking_new_patient: web_booking_new_patient ?? true,
        web_booking_returning: web_booking_returning ?? true
      }
    })

    const result: Record<string, any> = { ...menu }
    if (result.created_at instanceof Date) {
      result.created_at = result.created_at.toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('診療メニュー作成エラー:', error)
    return NextResponse.json(
      { error: '診療メニューの作成に失敗しました' },
      { status: 500 }
    )
  }
}
