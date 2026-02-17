import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * PUT /api/treatment-menus/[id]
 * 診療メニューを更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrismaClient()
    const { id } = await params
    const body = await request.json()

    // 許可フィールドのみ抽出（余分なフィールドによるエラー防止）
    const allowedFields = ['name', 'standard_duration', 'color', 'sort_order', 'is_active', 'parent_id', 'level', 'web_booking_enabled', 'web_booking_staff_ids', 'web_booking_duration', 'web_booking_new_patient', 'web_booking_returning']
    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    console.log('診療メニュー更新:', { id, updateData })

    const menu = await prisma.treatment_menus.update({
      where: { id },
      data: updateData
    })

    const result: Record<string, any> = { ...menu }
    if (result.created_at instanceof Date) {
      result.created_at = result.created_at.toISOString()
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('診療メニュー更新エラー:', error?.message || error)
    console.error('エラー詳細:', { code: error?.code, meta: error?.meta })
    return NextResponse.json(
      { error: '診療メニューの更新に失敗しました', details: error?.message, code: error?.code },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/treatment-menus/[id]
 * 診療メニューを論理削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrismaClient()
    const { id } = await params

    await prisma.treatment_menus.update({
      where: { id },
      data: { is_active: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('診療メニュー削除エラー:', error)
    return NextResponse.json(
      { error: '診療メニューの削除に失敗しました' },
      { status: 500 }
    )
  }
}
