/**
 * 病名コード検索API
 * Disease Codes Search API
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchDiseaseCodes } from '@/lib/api/emr'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('search') || searchParams.get('q') || ''
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 20

    if (!query || query.length < 1) {
      return NextResponse.json([])
    }

    const results = await searchDiseaseCodes(query, limit)
    return NextResponse.json(results)
  } catch (error) {
    console.error('病名検索APIエラー:', error)
    return NextResponse.json(
      { error: '病名の検索に失敗しました' },
      { status: 500 }
    )
  }
}
