// Migrated to Prisma API Routes
/**
 * 期限切れQRトークンクリーンアップ API Route
 * POST: 期限切れのactiveトークンをexpiredに更新
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * POST: 期限切れQRトークンをクリーンアップ
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const result = await prisma.line_qr_tokens.updateMany({
      where: {
        status: 'active',
        expires_at: {
          lt: new Date()
        }
      },
      data: {
        status: 'expired'
      }
    })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    console.error('期限切れQRトークンクリーンアップエラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'クリーンアップに失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}
