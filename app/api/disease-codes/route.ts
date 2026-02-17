/**
 * 病名コード検索API - Prisma版
 * Disease Codes Search API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('search') || searchParams.get('q') || ''
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 20
    const dentalOnly = searchParams.get('dental_only') === 'true'
    const id = searchParams.get('id')

    // IDで取得
    if (id) {
      const disease = await prisma.disease_codes.findUnique({
        where: { id },
      })
      return NextResponse.json(disease)
    }

    if (!query || query.length < 1) {
      return NextResponse.json([])
    }

    // C1/C2/C3などの入力を正式名称に変換
    const cariesMap: { [key: string]: string } = {
      'c1': 'う蝕第１度', 'c2': 'う蝕第２度', 'c3': 'う蝕第３度', 'c4': 'う蝕第４度',
      'C1': 'う蝕第１度', 'C2': 'う蝕第２度', 'C3': 'う蝕第３度', 'C4': 'う蝕第４度',
    }

    const expandedQueries: string[] = [query]
    if (cariesMap[query]) {
      expandedQueries.push(cariesMap[query])
    }

    // 複数の検索条件でOR検索
    const orConditions = expandedQueries.flatMap((q) => [
      { name: { contains: q, mode: 'insensitive' as const } },
      { kana: { contains: q, mode: 'insensitive' as const } },
      { code: { contains: q, mode: 'insensitive' as const } },
    ])

    const where: any = {
      OR: orConditions,
    }

    if (dentalOnly) {
      where.is_dental = true
    }

    const results = await prisma.disease_codes.findMany({
      where,
      take: limit,
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('病名検索APIエラー:', error)
    return NextResponse.json(
      { error: '病名の検索に失敗しました' },
      { status: 500 }
    )
  }
}
