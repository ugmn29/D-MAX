import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, convertArrayDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at'] as const

// 広告媒体マスター一覧を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')

    const prisma = getPrismaClient()

    // システム共通の媒体とクリニック固有の媒体を取得
    const where: any = {
      is_active: true,
    }

    if (clinic_id) {
      // クリニック固有 OR システム共通（clinic_id = NULL）
      where.OR = [
        { clinic_id },
        { clinic_id: null },
      ]
    } else {
      // システム共通のみ
      where.clinic_id = null
    }

    const data = await prisma.ad_sources_master.findMany({
      where,
      orderBy: { sort_order: 'asc' },
    })

    const converted = convertArrayDatesToStrings(data, [...DATE_FIELDS])

    // カテゴリ別にグループ化
    const categories = new Map<string, any[]>()
    converted.forEach((source) => {
      if (!categories.has(source.category)) {
        categories.set(source.category, [])
      }
      categories.get(source.category)!.push(source)
    })

    return NextResponse.json({
      success: true,
      data: {
        sources: converted,
        by_category: Object.fromEntries(categories),
      },
    })
  } catch (error) {
    console.error('広告媒体API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 広告媒体を追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, name, category, utm_source, utm_medium, description } = body

    if (!clinic_id || !name || !category || !utm_source) {
      return NextResponse.json(
        { error: 'clinic_id, name, category, utm_source are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 同じutm_sourceが既に存在するか確認
    const existing = await prisma.ad_sources_master.findFirst({
      where: {
        clinic_id,
        utm_source,
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'utm_source already exists for this clinic' },
        { status: 409 }
      )
    }

    // 最大sort_orderを取得
    const maxOrderRecord = await prisma.ad_sources_master.findFirst({
      where: {
        OR: [
          { clinic_id },
          { clinic_id: null },
        ],
      },
      orderBy: { sort_order: 'desc' },
      select: { sort_order: true },
    })

    const newSortOrder = (maxOrderRecord?.sort_order || 0) + 1

    const data = await prisma.ad_sources_master.create({
      data: {
        clinic_id,
        name,
        category,
        utm_source,
        utm_medium: utm_medium || 'custom',
        description,
        is_system: false,
        sort_order: newSortOrder,
      },
    })

    return NextResponse.json({
      success: true,
      data: convertDatesToStrings(data, [...DATE_FIELDS]),
    })
  } catch (error) {
    console.error('広告媒体追加API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 広告媒体を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, category, utm_source, utm_medium, description, is_active } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // システム媒体は編集不可
    const source = await prisma.ad_sources_master.findUnique({
      where: { id },
      select: { is_system: true },
    })

    if (source?.is_system) {
      return NextResponse.json(
        { error: 'System ad sources cannot be modified' },
        { status: 403 }
      )
    }

    const updateData: any = { updated_at: new Date() }
    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (utm_source !== undefined) updateData.utm_source = utm_source
    if (utm_medium !== undefined) updateData.utm_medium = utm_medium
    if (description !== undefined) updateData.description = description
    if (is_active !== undefined) updateData.is_active = is_active

    const data = await prisma.ad_sources_master.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: convertDatesToStrings(data, [...DATE_FIELDS]),
    })
  } catch (error) {
    console.error('広告媒体更新API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 広告媒体を削除
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // システム媒体は削除不可
    const source = await prisma.ad_sources_master.findUnique({
      where: { id },
      select: { is_system: true },
    })

    if (source?.is_system) {
      return NextResponse.json(
        { error: 'System ad sources cannot be deleted' },
        { status: 403 }
      )
    }

    await prisma.ad_sources_master.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('広告媒体削除API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
