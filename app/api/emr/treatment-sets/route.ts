/**
 * 処置セットAPI Route
 * Treatment Sets API - Prisma版
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 処置セットの取得（全件、コード指定、病名コード指定、セットアイテム取得）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const setId = searchParams.get('set_id')
    const items = searchParams.get('items') === 'true'
    const diseaseCode = searchParams.get('disease_code')

    // セットIDでアイテム取得
    if (setId && items) {
      const setItems = await prisma.treatment_set_items.findMany({
        where: { set_id: setId },
        orderBy: { display_order: 'asc' },
      })

      if (!setItems || setItems.length === 0) {
        return NextResponse.json([])
      }

      // 各アイテムの処置情報を取得
      const itemsWithTreatments = await Promise.all(
        setItems.map(async (item) => {
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
    }

    // 病名コードから推奨処置セットを取得
    if (diseaseCode) {
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
    }

    // コードで特定の処置セットを取得
    if (code) {
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
