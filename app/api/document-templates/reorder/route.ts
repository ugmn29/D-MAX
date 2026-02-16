import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// POST - テンプレートの並び順を一括更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templates } = body // [{ id, display_order }, ...]
    const prisma = getPrismaClient()

    if (!Array.isArray(templates)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // トランザクション的に複数の更新を実行
    const updatePromises = templates.map(({ id, display_order }: { id: string; display_order: number }) =>
      prisma.document_templates.update({
        where: { id },
        data: { display_order }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/document-templates/reorder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
