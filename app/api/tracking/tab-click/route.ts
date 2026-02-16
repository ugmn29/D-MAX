import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['click_timestamp', 'booking_completed_at', 'created_at'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      session_id,
      clinic_id,
      tab_id,
      tab_label,
      tab_position,
      page_url,
      utm_source,
      utm_medium,
      utm_campaign,
      device_type,
      os,
      browser,
    } = body

    // バリデーション
    if (!session_id || !clinic_id || !tab_id || !tab_label) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // タブクリックイベントを記録
    const clickEvent = await prisma.hp_tab_click_events.create({
      data: {
        session_id,
        clinic_id,
        tab_id,
        tab_label,
        tab_position,
        page_url,
        utm_source,
        utm_medium,
        utm_campaign,
        device_type,
        os,
        browser,
        click_timestamp: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: convertDatesToStrings(clickEvent, [...DATE_FIELDS]) })
  } catch (error) {
    console.error('タブクリックAPI エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 予約完了時にタブクリックイベントを更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, did_complete_booking } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // セッションIDに紐づく最新のタブクリックイベントを取得
    const latestEvent = await prisma.hp_tab_click_events.findFirst({
      where: { session_id },
      orderBy: { click_timestamp: 'desc' },
    })

    if (!latestEvent) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 最新のイベントを更新
    const updated = await prisma.hp_tab_click_events.update({
      where: { id: latestEvent.id },
      data: {
        did_visit_booking: true,
        did_complete_booking: did_complete_booking || false,
        booking_completed_at: did_complete_booking ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, data: [convertDatesToStrings(updated, [...DATE_FIELDS])] })
  } catch (error) {
    console.error('タブクリック更新API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
