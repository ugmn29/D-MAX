import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, convertArrayDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['spend_date', 'created_at', 'updated_at'] as const

// GET: 広告費記録を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const where: any = { clinic_id }

    if (start_date || end_date) {
      where.spend_date = {}
      if (start_date) {
        where.spend_date.gte = new Date(start_date)
      }
      if (end_date) {
        where.spend_date.lte = new Date(end_date)
      }
    }

    const data = await prisma.ad_spend_records.findMany({
      where,
      orderBy: { spend_date: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: convertArrayDatesToStrings(data, [...DATE_FIELDS]),
    })
  } catch (error) {
    console.error('広告費取得APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 広告費記録を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      ad_platform,
      campaign_name,
      spend_date,
      amount,
      currency,
      notes
    } = body

    if (!clinic_id || !ad_platform || !spend_date || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const data = await prisma.ad_spend_records.create({
      data: {
        clinic_id,
        ad_platform,
        campaign_name: campaign_name || null,
        spend_date: new Date(spend_date),
        amount,
        currency: currency || 'JPY',
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: convertDatesToStrings(data, [...DATE_FIELDS]) })
  } catch (error) {
    console.error('広告費作成APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 広告費記録を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      ad_platform,
      campaign_name,
      spend_date,
      amount,
      currency,
      notes
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const data = await prisma.ad_spend_records.update({
      where: { id },
      data: {
        ad_platform,
        campaign_name,
        spend_date: spend_date ? new Date(spend_date) : undefined,
        amount,
        currency,
        notes,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: convertDatesToStrings(data, [...DATE_FIELDS]) })
  } catch (error) {
    console.error('広告費更新APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 広告費記録を削除
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

    await prisma.ad_spend_records.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('広告費削除APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
