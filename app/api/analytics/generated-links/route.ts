import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// GET: リンク生成履歴を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const linkType = searchParams.get('link_type') // qr_code, sns_link, hp_embed
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const where: Record<string, unknown> = { clinic_id: clinicId }
    if (linkType) {
      where.link_type = linkType
    }

    const data = await prisma.generated_links_history.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    })

    const serialized = data.map(item =>
      convertDatesToStrings(item, ['created_at', 'last_clicked_at'])
    )

    return NextResponse.json({ data: serialized })
  } catch (error) {
    console.error('Get generated links error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 新しいリンクを保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      link_type,
      generated_url,
      destination_url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      platform,
      placement,
      label,
      qr_code_url,
      created_by,
    } = body

    if (!clinic_id || !link_type || !generated_url) {
      return NextResponse.json(
        { error: 'clinic_id, link_type, generated_url are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const data = await prisma.generated_links_history.create({
      data: {
        clinic_id,
        link_type,
        generated_url,
        destination_url: destination_url || generated_url,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        platform,
        placement,
        label,
        qr_code_url,
        created_by,
      },
    })

    const serialized = convertDatesToStrings(data, ['created_at', 'last_clicked_at'])

    return NextResponse.json({ data: serialized })
  } catch (error) {
    console.error('Save generated link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: リンクを削除
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

    await prisma.generated_links_history.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete generated link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
