/**
 * サブカルテテンプレートAPI Route - Prisma版
 * Subkarte Templates API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET - テンプレートを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    const templates = await prisma.subkarte_templates.findMany({
      where: {
        clinic_id: clinicId,
        is_active: true,
      },
      orderBy: { sort_order: 'asc' },
    })

    // Date型をISO文字列に変換
    const result = templates.map((template) => ({
      ...template,
      created_at: template.created_at?.toISOString() ?? null,
      updated_at: template.updated_at?.toISOString() ?? null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('テンプレート取得エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - テンプレートを作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prisma = getPrismaClient()

    const template = await prisma.subkarte_templates.create({
      data: body,
    })

    const result = {
      ...template,
      created_at: template.created_at?.toISOString() ?? null,
      updated_at: template.updated_at?.toISOString() ?? null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('テンプレート作成エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
