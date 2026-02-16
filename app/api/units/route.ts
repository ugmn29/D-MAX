import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/units?clinic_id=xxx
 * ユニット一覧を取得
 */
export async function GET(request: NextRequest) {
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

    const units = await prisma.units.findMany({
      where: {
        clinic_id: clinicId
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    const unitsWithStringDates = units.map(unit =>
      convertDatesToStrings(unit, ['created_at', 'updated_at'])
    )

    return NextResponse.json(unitsWithStringDates)
  } catch (error) {
    console.error('ユニット取得エラー:', error)
    return NextResponse.json(
      { error: 'ユニットの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/units?clinic_id=xxx
 * ユニットを作成
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
    const { name, sort_order, is_active } = body

    if (!name) {
      return NextResponse.json(
        { error: 'ユニット名は必須です' },
        { status: 400 }
      )
    }

    const unit = await prisma.units.create({
      data: {
        clinic_id: clinicId,
        name,
        sort_order: sort_order || 999,
        is_active: is_active !== undefined ? is_active : true
      }
    })

    const unitWithStringDates = convertDatesToStrings(unit, ['created_at', 'updated_at'])

    return NextResponse.json(unitWithStringDates)
  } catch (error) {
    console.error('ユニット作成エラー:', error)
    return NextResponse.json(
      { error: 'ユニットの作成に失敗しました' },
      { status: 500 }
    )
  }
}
