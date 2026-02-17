/**
 * 関連処置検索API Route
 * Related Treatment Search API - Prisma版
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 手動で関連処置を検索
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('q') || searchParams.get('keyword')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!keyword) {
      return NextResponse.json([])
    }

    const where: any = {
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
      ],
    }

    if (category) {
      where.code = { startsWith: category }
    }

    const treatments = await prisma.treatment_codes.findMany({
      where,
      take: limit,
    })

    return NextResponse.json(treatments || [])
  } catch (error) {
    console.error('関連処置検索API エラー:', error)
    return NextResponse.json(
      { error: '関連処置の検索に失敗しました' },
      { status: 500 }
    )
  }
}
