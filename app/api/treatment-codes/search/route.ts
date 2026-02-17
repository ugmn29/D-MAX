/**
 * 診療行為コード詳細検索API
 * Treatment Codes Search API (for suggestions, related treatments)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 診療行為コードを検索
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const keyword = searchParams.get('keyword')
    const excludeCode = searchParams.get('exclude_code')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const category = searchParams.get('category')

    // 単一コードで取得
    if (code) {
      const treatment = await prisma.treatment_codes.findUnique({
        where: { code },
      })

      if (!treatment) {
        return NextResponse.json(null)
      }

      return NextResponse.json(treatment)
    }

    // キーワード検索（ilike）
    if (keyword) {
      const where: any = {
        name: { contains: keyword, mode: 'insensitive' },
      }

      if (excludeCode) {
        where.code = { not: excludeCode }
      }

      if (category) {
        where.code = {
          ...where.code,
          startsWith: category,
        }
      }

      const treatments = await prisma.treatment_codes.findMany({
        where,
        select: { code: true, name: true, points: true },
        take: limit,
      })

      return NextResponse.json(treatments)
    }

    // OR検索（name or code）
    const q = searchParams.get('q')
    if (q) {
      const treatments = await prisma.treatment_codes.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
          ],
          ...(category ? { code: { startsWith: category } } : {}),
        },
        take: limit,
      })

      return NextResponse.json(treatments)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('診療行為コード検索API エラー:', error)
    return NextResponse.json(
      { error: '診療行為コードの検索に失敗しました' },
      { status: 500 }
    )
  }
}
