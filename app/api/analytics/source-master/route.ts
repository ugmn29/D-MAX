import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// GET: 流入元マスタを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const data = await prisma.acquisition_source_master.findMany({
      where: {
        clinic_id: clinicId,
        is_active: true,
      },
      orderBy: { sort_order: 'asc' },
    })

    const serialized = data.map(item =>
      convertDatesToStrings(item, ['created_at', 'updated_at'])
    )

    // カテゴリ別にグループ化
    const grouped = {
      online: serialized.filter(s => s.category === 'online'),
      offline: serialized.filter(s => s.category === 'offline'),
      referral: serialized.filter(s => s.category === 'referral'),
    }

    return NextResponse.json({ data: serialized, grouped })
  } catch (error) {
    console.error('Get acquisition sources error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 新しい流入元を追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      normalized_name,
      display_name,
      category,
      utm_source_patterns,
      questionnaire_patterns,
      sort_order,
    } = body

    if (!clinic_id || !normalized_name || !display_name || !category) {
      return NextResponse.json(
        { error: 'clinic_id, normalized_name, display_name, category are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const data = await prisma.acquisition_source_master.create({
      data: {
        clinic_id,
        normalized_name,
        display_name,
        category,
        utm_source_patterns: utm_source_patterns || [],
        questionnaire_patterns: questionnaire_patterns || [],
        sort_order: sort_order || 0,
      },
    })

    const serialized = convertDatesToStrings(data, ['created_at', 'updated_at'])

    return NextResponse.json({ data: serialized })
  } catch (error) {
    console.error('Add acquisition source error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 流入元を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      normalized_name,
      display_name,
      category,
      utm_source_patterns,
      questionnaire_patterns,
      sort_order,
      is_active,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (normalized_name !== undefined) updateData.normalized_name = normalized_name
    if (display_name !== undefined) updateData.display_name = display_name
    if (category !== undefined) updateData.category = category
    if (utm_source_patterns !== undefined) updateData.utm_source_patterns = utm_source_patterns
    if (questionnaire_patterns !== undefined) updateData.questionnaire_patterns = questionnaire_patterns
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_active !== undefined) updateData.is_active = is_active

    const data = await prisma.acquisition_source_master.update({
      where: { id },
      data: updateData,
    })

    const serialized = convertDatesToStrings(data, ['created_at', 'updated_at'])

    return NextResponse.json({ data: serialized })
  } catch (error) {
    console.error('Update acquisition source error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 流入元を削除（論理削除）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 論理削除
    await prisma.acquisition_source_master.update({
      where: { id },
      data: { is_active: false, updated_at: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete acquisition source error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
