import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const activeOnly = searchParams.get('active_only') === 'true'

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const whereClause: any = { clinic_id: clinicId }
    if (activeOnly) {
      whereClause.is_active = true
    }

    const menus = await prisma.treatment_menus.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        level: true,
        parent_id: true,
        sort_order: true,
        is_active: true,
        created_at: true,
      },
      orderBy: [
        { level: 'asc' },
        { sort_order: 'asc' },
      ],
    })

    const result = menus.map(menu => ({
      id: menu.id,
      name: menu.name,
      level: menu.level,
      parent_id: menu.parent_id,
      sort_order: menu.sort_order ?? 0,
      is_active: menu.is_active ?? true,
      created_at: menu.created_at ? menu.created_at.toISOString() : null,
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('診療メニュー取得エラー:', error)
    return NextResponse.json(
      { error: error.message || '診療メニューの取得に失敗しました' },
      { status: 500 }
    )
  }
}
