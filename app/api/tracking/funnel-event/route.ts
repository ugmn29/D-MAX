import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['event_timestamp', 'created_at'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      session_id,
      clinic_id,
      step_name,
      step_number,
      event_type,
      utm_source,
      utm_medium,
      utm_campaign,
      device_type,
      metadata,
    } = body

    // 必須フィールドの検証
    if (!session_id || !clinic_id || !step_name || !step_number || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // ファネルイベントを記録
    const data = await prisma.web_booking_funnel_events.create({
      data: {
        session_id,
        clinic_id,
        step_name,
        step_number,
        event_type,
        utm_source,
        utm_medium,
        utm_campaign,
        device_type,
        metadata: metadata || undefined,
      },
    })

    return NextResponse.json({ success: true, data: convertDatesToStrings(data, [...DATE_FIELDS]) })
  } catch (error) {
    console.error('ファネルイベントAPI エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
