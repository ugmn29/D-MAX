/**
 * サブカルテ音声データ個別API Route - Prisma版
 * Subkarte Audio by ID API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// PUT - 音声データの文字起こしを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const prisma = getPrismaClient()

    await prisma.subkarte_audio.update({
      where: { id },
      data: { transcription: body.transcription },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('音声文字起こし更新エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
