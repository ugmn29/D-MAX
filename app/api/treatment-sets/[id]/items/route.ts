/**
 * 処置セット構成要素API Route
 * Treatment Set Items API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 処置セットの構成要素を取得（処置情報を含む）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: setId } = await params

    const items = await prisma.treatment_set_items.findMany({
      where: { set_id: setId },
      orderBy: { display_order: 'asc' },
    })

    if (!items || items.length === 0) {
      return NextResponse.json([])
    }

    // 各アイテムの処置情報を取得
    const itemsWithTreatments = await Promise.all(
      items.map(async (item) => {
        const treatment = await prisma.treatment_codes.findUnique({
          where: { code: item.treatment_code },
          select: { code: true, name: true, points: true },
        })

        return {
          ...item,
          treatment: treatment || undefined,
        }
      })
    )

    return NextResponse.json(itemsWithTreatments)
  } catch (error) {
    console.error('処置セット構成要素API エラー:', error)
    return NextResponse.json(
      { error: '処置セット構成要素の取得に失敗しました' },
      { status: 500 }
    )
  }
}
