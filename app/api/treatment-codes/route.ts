/**
 * 診療行為コード検索API - Prisma版
 * Treatment Codes Search API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('search') || searchParams.get('q') || ''
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 20
    const id = searchParams.get('id')

    // IDで取得
    if (id) {
      const treatment = await prisma.treatment_codes.findUnique({
        where: { id },
      })
      return NextResponse.json(treatment)
    }

    // metadataのみ取得
    const metadataOnly = searchParams.get('metadata_only')
    if (metadataOnly) {
      const treatment = await prisma.treatment_codes.findUnique({
        where: { id: metadataOnly },
        select: { metadata: true },
      })
      return NextResponse.json(treatment?.metadata || null)
    }

    if (!query || query.length < 1) {
      return NextResponse.json([])
    }

    const results = await prisma.treatment_codes.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('診療行為検索APIエラー:', error)
    return NextResponse.json(
      { error: '診療行為の検索に失敗しました' },
      { status: 500 }
    )
  }
}
