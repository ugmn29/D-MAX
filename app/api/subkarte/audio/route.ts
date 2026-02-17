/**
 * サブカルテ音声データAPI Route - Prisma版
 * Subkarte Audio API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// POST - 音声データを保存（一時保存）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prisma = getPrismaClient()

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1時間後に期限切れ

    const audio = await prisma.subkarte_audio.create({
      data: {
        ...body,
        expires_at: expiresAt,
      },
    })

    const result = {
      ...audio,
      created_at: audio.created_at?.toISOString() ?? null,
      expires_at: audio.expires_at?.toISOString() ?? null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('音声データ保存エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 期限切れ音声データをクリーンアップ
export async function DELETE() {
  try {
    const prisma = getPrismaClient()

    await prisma.subkarte_audio.deleteMany({
      where: {
        expires_at: { lt: new Date() },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('期限切れ音声データクリーンアップエラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
