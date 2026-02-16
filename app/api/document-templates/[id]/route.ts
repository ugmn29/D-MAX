import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// PUT - テンプレート更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params
    const prisma = getPrismaClient()

    const data = await prisma.document_templates.update({
      where: { id },
      data: {
        template_name: body.template_name,
        template_data: body.template_data,
        display_order: body.display_order
      }
    })

    const result = convertDatesToStrings(data, ['created_at', 'updated_at'])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PUT /api/document-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - テンプレート論理削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrismaClient()

    // 論理削除（is_active を false に設定）
    const data = await prisma.document_templates.update({
      where: { id },
      data: { is_active: false }
    })

    const result = convertDatesToStrings(data, ['created_at', 'updated_at'])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in DELETE /api/document-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
