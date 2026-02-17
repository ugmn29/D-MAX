import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

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

    const reasons = await prisma.cancel_reasons.findMany({
      where: { clinic_id: clinicId },
      select: {
        id: true,
        name: true,
        description: true,
        is_active: true,
        sort_order: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { sort_order: 'asc' },
    })

    const result = reasons.map(reason => ({
      id: reason.id,
      name: reason.name,
      description: reason.description,
      is_active: reason.is_active ?? true,
      sort_order: reason.sort_order ?? 0,
      created_at: reason.created_at ? reason.created_at.toISOString() : null,
      updated_at: reason.updated_at ? reason.updated_at.toISOString() : null,
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('キャンセル理由取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'キャンセル理由の取得に失敗しました' },
      { status: 500 }
    )
  }
}
