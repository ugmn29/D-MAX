/**
 * 処置セットAPI Route
 * Treatment Sets API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 全ての処置セットを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
      // コードで特定の処置セットを取得
      const set = await prisma.treatment_sets.findUnique({
        where: { code, is_active: true },
      })

      if (!set) {
        return NextResponse.json(null)
      }

      return NextResponse.json(set)
    }

    // 全ての有効な処置セットを取得
    const sets = await prisma.treatment_sets.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    })

    return NextResponse.json(sets)
  } catch (error) {
    console.error('処置セットAPI エラー:', error)
    return NextResponse.json(
      { error: '処置セットの取得に失敗しました' },
      { status: 500 }
    )
  }
}
