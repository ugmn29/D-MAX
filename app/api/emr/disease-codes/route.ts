/**
 * 病名コードAPI Route
 * Disease Codes API - Prisma版
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 病名コードの検索・取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const query = searchParams.get('query')
    const dentalOnly = searchParams.get('dental_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // IDで単一取得
    if (id) {
      const diseaseCode = await prisma.disease_codes.findUnique({
        where: { id },
      })

      if (!diseaseCode) {
        return NextResponse.json(null)
      }

      return NextResponse.json(diseaseCode)
    }

    // キーワード検索
    if (query) {
      // C1/C2/C3などの入力を正式名称に変換
      const cariesMap: { [key: string]: string } = {
        'c1': 'う蝕第１度',
        'c2': 'う蝕第２度',
        'c3': 'う蝕第３度',
        'c4': 'う蝕第４度',
        'C1': 'う蝕第１度',
        'C2': 'う蝕第２度',
        'C3': 'う蝕第３度',
        'C4': 'う蝕第４度',
      }

      // クエリがC1〜C4の場合、正式名称も検索対象に含める
      const expandedQueries: string[] = [query]
      if (cariesMap[query]) {
        expandedQueries.push(cariesMap[query])
      }

      // 複数の検索条件でOR検索
      const orConditions = expandedQueries.flatMap(q => [
        { name: { contains: q, mode: 'insensitive' as const } },
        { kana: { contains: q, mode: 'insensitive' as const } },
        { code: { contains: q, mode: 'insensitive' as const } },
      ])

      const where: any = {
        OR: orConditions,
      }

      // 歯科関連のみフィルタ（オプション）
      if (dentalOnly) {
        where.is_dental = true
      }

      const diseaseCodes = await prisma.disease_codes.findMany({
        where,
        take: limit,
      })

      return NextResponse.json(diseaseCodes || [])
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('病名コードAPI エラー:', error)
    return NextResponse.json(
      { error: '病名コードの取得に失敗しました' },
      { status: 500 }
    )
  }
}
