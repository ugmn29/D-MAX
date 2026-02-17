import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * PATCH /api/web-booking-tokens/[id]/mark-used
 * トークンを使用済みにマーク
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrismaClient()
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'token id is required' },
        { status: 400 }
      )
    }

    await prisma.web_booking_tokens.update({
      where: { id },
      data: {
        used_at: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('トークン使用済みマークエラー:', error)

    // Prisma P2025: Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'トークンが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'トークンの更新に失敗しました' },
      { status: 500 }
    )
  }
}
