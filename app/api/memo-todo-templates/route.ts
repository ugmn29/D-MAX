import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at']

// GET /api/memo-todo-templates?clinic_id=xxx[&active_only=true][&id=xxx]
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const activeOnly = searchParams.get('active_only')
    const id = searchParams.get('id')

    // Single template by ID
    if (id) {
      const template = await prisma.memo_todo_templates.findUnique({
        where: { id }
      })
      if (!template) {
        return NextResponse.json(null)
      }
      return NextResponse.json(convertDatesToStrings(template, DATE_FIELDS))
    }

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const where: any = { clinic_id: clinicId }
    if (activeOnly === 'true') {
      where.is_active = true
    }

    const data = await prisma.memo_todo_templates.findMany({
      where,
      orderBy: { sort_order: 'asc' }
    })

    return NextResponse.json(data.map(d => convertDatesToStrings(d, DATE_FIELDS)))
  } catch (error) {
    console.error('メモTODOテンプレート取得エラー:', error)
    return NextResponse.json({ error: 'テンプレートの取得に失敗しました' }, { status: 500 })
  }
}

// POST /api/memo-todo-templates - Create
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()

    const data = await prisma.memo_todo_templates.create({
      data: {
        clinic_id: body.clinic_id,
        name: body.name,
        items: body.items,
        sort_order: body.sort_order ?? 0,
        is_active: body.is_active ?? true
      }
    })

    return NextResponse.json(convertDatesToStrings(data, DATE_FIELDS))
  } catch (error) {
    console.error('メモTODOテンプレート作成エラー:', error)
    return NextResponse.json({ error: 'テンプレートの作成に失敗しました' }, { status: 500 })
  }
}

// PUT /api/memo-todo-templates - Update or reorder
export async function PUT(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { action } = body

    if (action === 'reorder') {
      const { updates } = body
      if (!updates || !Array.isArray(updates)) {
        return NextResponse.json({ error: 'updates array is required' }, { status: 400 })
      }
      await Promise.all(
        updates.map(({ id, sort_order }: { id: string; sort_order: number }) =>
          prisma.memo_todo_templates.update({
            where: { id },
            data: { sort_order, updated_at: new Date() }
          })
        )
      )
      return NextResponse.json({ success: true })
    }

    // Default update
    const { id, ...input } = body
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const data = await prisma.memo_todo_templates.update({
      where: { id },
      data: { ...input, updated_at: new Date() }
    })

    return NextResponse.json(convertDatesToStrings(data, DATE_FIELDS))
  } catch (error) {
    console.error('メモTODOテンプレート更新エラー:', error)
    return NextResponse.json({ error: 'テンプレートの更新に失敗しました' }, { status: 500 })
  }
}

// DELETE /api/memo-todo-templates?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.memo_todo_templates.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('メモTODOテンプレート削除エラー:', error)
    return NextResponse.json({ error: 'テンプレートの削除に失敗しました' }, { status: 500 })
  }
}
