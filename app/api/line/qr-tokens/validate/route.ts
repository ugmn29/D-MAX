// Migrated to Prisma API Routes
/**
 * QRトークン検証 API Route
 * POST: トークン文字列を検証して有効なトークンを返す
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const QR_TOKEN_DATE_FIELDS = ['generated_at', 'expires_at', 'used_at', 'created_at', 'updated_at'] as const

/**
 * POST: トークンを検証
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const data = await prisma.line_qr_tokens.findUnique({
      where: { token }
    })

    if (!data) {
      return NextResponse.json(null)
    }

    // 有効期限チェック
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    if (now > expiresAt) {
      // 期限切れ - ステータスを更新
      await prisma.line_qr_tokens.update({
        where: { id: data.id },
        data: { status: 'expired' }
      })
      return NextResponse.json(null)
    }

    // ステータスチェック
    if (data.status !== 'active') {
      return NextResponse.json(null)
    }

    const result = convertDatesToStrings(data, [...QR_TOKEN_DATE_FIELDS])

    return NextResponse.json(result)
  } catch (error) {
    console.error('QRトークン検証エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'QRトークンの検証に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}
