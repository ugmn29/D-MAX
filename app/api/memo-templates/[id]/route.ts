import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * PUT /api/memo-templates/[id]?clinic_id=xxx
 * メモテンプレートを更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrismaClient()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, is_active, sort_order } = body

    // 名前が更新される場合は内容も同じにする
    const updateData: Record<string, any> = {}
    if (name !== undefined) {
      updateData.name = name
      updateData.content = name
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active
    }
    if (sort_order !== undefined) {
      updateData.sort_order = sort_order
    }

    const template = await prisma.memo_templates.update({
      where: { id },
      data: updateData
    })

    const templateWithStringDates = convertDatesToStrings(template, ['created_at', 'updated_at'])

    return NextResponse.json(templateWithStringDates)
  } catch (error) {
    console.error('メモテンプレート更新エラー:', error)
    return NextResponse.json(
      { error: 'メモテンプレートの更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/memo-templates/[id]?clinic_id=xxx
 * メモテンプレートを論理削除（is_active = false）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrismaClient()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    await prisma.memo_templates.update({
      where: { id },
      data: { is_active: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('メモテンプレート削除エラー:', error)
    return NextResponse.json(
      { error: 'メモテンプレートの削除に失敗しました' },
      { status: 500 }
    )
  }
}
