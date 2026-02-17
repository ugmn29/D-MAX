// Migrated to Prisma API Routes
/**
 * QRトークン個別操作 API Route
 * PATCH: トークンのステータスを更新（used / expired）
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const QR_TOKEN_DATE_FIELDS = ['generated_at', 'expires_at', 'used_at', 'created_at', 'updated_at'] as const

/**
 * PATCH: トークンのステータスを更新
 * Body: { status: 'used' | 'expired', used_at?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, used_at } = body

    if (!status || !['used', 'expired'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "used" or "expired"' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const updateData: any = { status }
    if (status === 'used') {
      updateData.used_at = used_at ? new Date(used_at) : new Date()
    }

    const data = await prisma.line_qr_tokens.update({
      where: { id },
      data: updateData
    })

    const result = convertDatesToStrings(data, [...QR_TOKEN_DATE_FIELDS])

    return NextResponse.json(result)
  } catch (error) {
    console.error('QRトークン更新エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'QRトークンの更新に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}
