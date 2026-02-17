import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/memo-templates?clinic_id=xxx
 * メモテンプレート一覧を取得（アクティブのみ、sort_order昇順）
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const templates = await prisma.memo_templates.findMany({
      where: {
        clinic_id: clinicId,
        is_active: true
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    const templatesWithStringDates = templates.map(template =>
      convertDatesToStrings(template, ['created_at', 'updated_at'])
    )

    return NextResponse.json(templatesWithStringDates)
  } catch (error) {
    console.error('メモテンプレート取得エラー:', error)
    return NextResponse.json(
      { error: 'メモテンプレートの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/memo-templates?clinic_id=xxx
 * メモテンプレートを作成
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, sort_order, is_active } = body

    if (!name) {
      return NextResponse.json(
        { error: 'テンプレート名は必須です' },
        { status: 400 }
      )
    }

    const template = await prisma.memo_templates.create({
      data: {
        clinic_id: clinicId,
        name,
        content: name, // 名前をそのまま内容として使用
        sort_order: sort_order ?? 0,
        is_active: is_active !== undefined ? is_active : true
      }
    })

    const templateWithStringDates = convertDatesToStrings(template, ['created_at', 'updated_at'])

    return NextResponse.json(templateWithStringDates)
  } catch (error) {
    console.error('メモテンプレート作成エラー:', error)
    return NextResponse.json(
      { error: 'メモテンプレートの作成に失敗しました' },
      { status: 500 }
    )
  }
}
