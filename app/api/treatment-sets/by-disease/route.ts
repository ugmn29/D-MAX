/**
 * 病名から推奨処置セットAPI Route
 * Suggested Treatment Sets by Disease Code API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 病名コードから推奨される処置セットを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const diseaseCode = searchParams.get('disease_code')

    if (!diseaseCode) {
      return NextResponse.json(
        { error: 'disease_code is required' },
        { status: 400 }
      )
    }

    const mappings = await prisma.disease_treatment_set_mapping.findMany({
      where: { disease_code: diseaseCode },
      include: {
        treatment_sets: true,
      },
      orderBy: { priority: 'desc' },
    })

    const sets = mappings
      .map((m) => m.treatment_sets)
      .filter(Boolean)

    return NextResponse.json(sets)
  } catch (error) {
    console.error('推奨処置セットAPI エラー:', error)
    return NextResponse.json(
      { error: '推奨処置セットの取得に失敗しました' },
      { status: 500 }
    )
  }
}
