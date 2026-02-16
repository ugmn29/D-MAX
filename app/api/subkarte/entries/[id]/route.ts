/**
 * サブカルテエントリ個別API Route - Prisma版
 * Subkarte Entry by ID API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// PUT - サブカルテエントリを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const prisma = getPrismaClient()

    const entry = await prisma.subkarte_entries.update({
      where: { id },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    const result = {
      ...entry,
      metadata: entry.metadata ?? {},
      created_at: entry.created_at?.toISOString() ?? null,
      updated_at: entry.updated_at?.toISOString() ?? null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('サブカルテエントリ更新エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - サブカルテエントリを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrismaClient()

    await prisma.subkarte_entries.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('サブカルテエントリ削除エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
