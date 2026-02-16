/**
 * サブカルテ手書きデータAPI Route - Prisma版
 * Subkarte Handwriting API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// POST - 手書きデータを保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prisma = getPrismaClient()

    const handwriting = await prisma.subkarte_handwriting.create({
      data: body,
    })

    const result = {
      ...handwriting,
      created_at: handwriting.created_at?.toISOString() ?? null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('手書きデータ保存エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
