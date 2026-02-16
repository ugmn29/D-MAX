import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrismaClient()

    const data = await prisma.clinics.findUnique({
      where: { id }
    })

    if (!data) {
      return NextResponse.json(
        { error: 'クリニックが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(convertDatesToStrings(data, ['created_at', 'updated_at']))
  } catch (error: any) {
    console.error('クリニック取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'クリニック情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrismaClient()
    const body = await request.json()
    const { slug } = body

    if (!slug) {
      return NextResponse.json(
        { error: 'URLスラッグが必要です' },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'URLスラッグは英小文字、数字、ハイフンのみ使用できます' },
        { status: 400 }
      )
    }

    // 重複チェック
    const existing = await prisma.clinics.findFirst({
      where: {
        slug,
        id: { not: id }
      },
      select: { id: true }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'このURLスラッグは既に使用されています' },
        { status: 409 }
      )
    }

    const data = await prisma.clinics.update({
      where: { id },
      data: { slug },
      select: { id: true, name: true, slug: true }
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('クリニック更新エラー:', error)
    return NextResponse.json(
      { error: error.message || 'クリニック情報の更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrismaClient()
    const body = await request.json()

    const data = await prisma.clinics.update({
      where: { id },
      data: {
        ...body,
        updated_at: new Date()
      }
    })

    return NextResponse.json(convertDatesToStrings(data, ['created_at', 'updated_at']))
  } catch (error: any) {
    console.error('クリニック設定更新エラー:', error)
    return NextResponse.json(
      { error: error.message || '設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}
