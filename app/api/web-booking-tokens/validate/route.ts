import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/web-booking-tokens/validate?token=xxx
 * トークンを検証して情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      )
    }

    const tokenData = await prisma.web_booking_tokens.findUnique({
      where: { token }
    })

    if (!tokenData) {
      return NextResponse.json(
        { error: 'トークンが見つかりません' },
        { status: 404 }
      )
    }

    // 有効期限チェック
    if (tokenData.expires_at < new Date()) {
      return NextResponse.json(
        { error: 'トークンの有効期限が切れています' },
        { status: 410 }
      )
    }

    // 使用済みチェック
    if (tokenData.used_at) {
      return NextResponse.json(
        { error: 'トークンは既に使用済みです' },
        { status: 410 }
      )
    }

    const result = convertDatesToStrings(tokenData, [
      'expires_at', 'used_at', 'created_at', 'updated_at'
    ])

    return NextResponse.json(result)
  } catch (error) {
    console.error('トークン検証エラー:', error)
    return NextResponse.json(
      { error: 'トークンの検証に失敗しました' },
      { status: 500 }
    )
  }
}
