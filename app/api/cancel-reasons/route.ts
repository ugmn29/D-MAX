import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/cancel-reasons?clinic_id=xxx
 * キャンセル理由一覧を取得（アクティブのみ）
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

    const reasons = await prisma.cancel_reasons.findMany({
      where: {
        clinic_id: clinicId,
        is_active: true
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    const reasonsWithStringDates = reasons.map(reason =>
      convertDatesToStrings(reason, ['created_at', 'updated_at'])
    )

    return NextResponse.json(reasonsWithStringDates)
  } catch (error) {
    console.error('キャンセル理由取得エラー:', error)
    return NextResponse.json(
      { error: 'キャンセル理由の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cancel-reasons?clinic_id=xxx
 * キャンセル理由を作成
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
    const { name, is_active } = body

    if (!name) {
      return NextResponse.json(
        { error: 'キャンセル理由名は必須です' },
        { status: 400 }
      )
    }

    const reason = await prisma.cancel_reasons.create({
      data: {
        clinic_id: clinicId,
        name,
        is_active: is_active !== undefined ? is_active : true
      }
    })

    const reasonWithStringDates = convertDatesToStrings(reason, ['created_at', 'updated_at'])

    return NextResponse.json(reasonWithStringDates)
  } catch (error) {
    console.error('キャンセル理由作成エラー:', error)
    return NextResponse.json(
      { error: 'キャンセル理由の作成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/cancel-reasons?id=xxx
 * キャンセル理由を更新
 */
export async function PUT(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, is_active } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (is_active !== undefined) updateData.is_active = is_active

    const reason = await prisma.cancel_reasons.update({
      where: { id },
      data: updateData
    })

    const reasonWithStringDates = convertDatesToStrings(reason, ['created_at', 'updated_at'])

    return NextResponse.json(reasonWithStringDates)
  } catch (error) {
    console.error('キャンセル理由更新エラー:', error)
    return NextResponse.json(
      { error: 'キャンセル理由の更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cancel-reasons?id=xxx
 * キャンセル理由を論理削除（is_active=false）
 */
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await prisma.cancel_reasons.update({
      where: { id },
      data: { is_active: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('キャンセル理由削除エラー:', error)
    return NextResponse.json(
      { error: 'キャンセル理由の削除に失敗しました' },
      { status: 500 }
    )
  }
}
