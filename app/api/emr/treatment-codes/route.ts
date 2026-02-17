/**
 * 診療行為コードAPI Route
 * Treatment Codes API - Prisma版
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 診療行為コードの検索・取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const query = searchParams.get('query')
    const keyword = searchParams.get('keyword')
    const metadataOnly = searchParams.get('metadata_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // IDで単一取得
    if (id) {
      if (metadataOnly) {
        // メタデータのみ取得
        const treatment = await prisma.treatment_codes.findUnique({
          where: { id },
          select: { metadata: true },
        })

        if (!treatment) {
          return NextResponse.json(null)
        }

        return NextResponse.json(treatment.metadata || null)
      }

      const treatment = await prisma.treatment_codes.findUnique({
        where: { id },
      })

      if (!treatment) {
        return NextResponse.json(null)
      }

      return NextResponse.json(treatment)
    }

    // 一般検索（name or code）
    if (query) {
      const treatments = await prisma.treatment_codes.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
      })

      return NextResponse.json(treatments || [])
    }

    // キーワード検索（name ilike のみ、limitとexclude対応）
    if (keyword) {
      const excludeCode = searchParams.get('exclude_code')

      const where: any = {
        name: { contains: keyword, mode: 'insensitive' },
      }

      if (excludeCode) {
        where.code = { not: excludeCode }
      }

      const treatments = await prisma.treatment_codes.findMany({
        where,
        select: { code: true, name: true, points: true },
        take: limit,
      })

      return NextResponse.json(treatments || [])
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('診療行為コードAPI エラー:', error)
    return NextResponse.json(
      { error: '診療行為コードの取得に失敗しました' },
      { status: 500 }
    )
  }
}
