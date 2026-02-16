import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['sent_at', 'opened_at', 'clicked_at', 'booked_at', 'created_at'] as const

/**
 * GET /api/notification-analytics
 * 通知分析データを取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const clinicId = searchParams.get('clinic_id')
    const notificationScheduleId = searchParams.get('notification_schedule_id')

    const where: any = {}
    if (patientId) where.patient_id = patientId
    if (clinicId) where.clinic_id = clinicId
    if (notificationScheduleId) where.notification_schedule_id = notificationScheduleId

    const analytics = await prisma.patient_notification_analytics.findMany({
      where,
      orderBy: { sent_at: 'desc' }
    })

    const mapped = analytics.map(a => convertDatesToStrings(a, [...DATE_FIELDS]))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error('通知分析データ取得エラー:', error)
    return NextResponse.json(
      { error: '通知分析データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notification-analytics
 * 通知分析データを記録
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()

    const analytics = await prisma.patient_notification_analytics.create({
      data: {
        patient_id: body.patient_id,
        clinic_id: body.clinic_id,
        notification_schedule_id: body.notification_schedule_id || null,
        sent_at: new Date(body.sent_at),
        send_channel: body.send_channel || null,
        hour_of_day: body.hour_of_day || null,
        day_of_week: body.day_of_week || null,
      }
    })

    return NextResponse.json(convertDatesToStrings(analytics, [...DATE_FIELDS]))
  } catch (error) {
    console.error('通知分析データ記録エラー:', error)
    return NextResponse.json(
      { error: '通知分析データの記録に失敗しました' },
      { status: 500 }
    )
  }
}
