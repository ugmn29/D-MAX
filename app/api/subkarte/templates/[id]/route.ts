/**
 * サブカルテテンプレート個別API Route - Prisma版
 * Subkarte Template by ID API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// PUT - テンプレートを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const prisma = getPrismaClient()

    const template = await prisma.subkarte_templates.update({
      where: { id },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    const result = {
      ...template,
      created_at: template.created_at?.toISOString() ?? null,
      updated_at: template.updated_at?.toISOString() ?? null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('テンプレート更新エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - テンプレートを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrismaClient()

    await prisma.subkarte_templates.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('テンプレート削除エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
