import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['send_datetime', 'sent_at', 'opened_at', 'clicked_at', 'web_booking_token_expires_at', 'created_at', 'updated_at'] as const

/**
 * GET /api/notification-schedules
 * 通知スケジュールを取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const clinicId = searchParams.get('clinic_id')
    const isAutoReminder = searchParams.get('is_auto_reminder')
    const appointmentId = searchParams.get('linked_appointment_id')
    const status = searchParams.get('status')
    const notificationType = searchParams.get('notification_type')
    const sendDateFrom = searchParams.get('send_date_from')
    const sendDateTo = searchParams.get('send_date_to')

    const where: any = {}
    if (patientId) where.patient_id = patientId
    if (clinicId) where.clinic_id = clinicId
    if (isAutoReminder === 'true') where.is_auto_reminder = true
    if (appointmentId) where.linked_appointment_id = appointmentId
    if (status) where.status = status
    if (notificationType) where.notification_type = notificationType

    // 送信日時の範囲フィルター
    if (sendDateFrom || sendDateTo) {
      where.send_datetime = {}
      if (sendDateFrom) where.send_datetime.gte = new Date(sendDateFrom)
      if (sendDateTo) where.send_datetime.lte = new Date(sendDateTo)
    }

    const schedules = await prisma.patient_notification_schedules.findMany({
      where,
      orderBy: { send_datetime: 'asc' }
    })

    const mapped = schedules.map(s => convertDatesToStrings(s, [...DATE_FIELDS]))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error('通知スケジュール取得エラー:', error)
    return NextResponse.json(
      { error: '通知スケジュールの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notification-schedules
 * 通知スケジュールを作成
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()

    const schedule = await prisma.patient_notification_schedules.create({
      data: {
        patient_id: body.patient_id,
        clinic_id: body.clinic_id,
        template_id: body.template_id || null,
        notification_type: body.notification_type,
        treatment_menu_id: body.treatment_menu_id || null,
        treatment_name: body.treatment_name || null,
        message: body.message,
        send_datetime: new Date(body.send_datetime),
        send_channel: body.send_channel,
        web_booking_enabled: body.web_booking_enabled ?? false,
        web_booking_menu_ids: body.web_booking_menu_ids || null,
        web_booking_staff_id: body.web_booking_staff_id || null,
        web_booking_token: body.web_booking_token || null,
        web_booking_token_expires_at: body.web_booking_token_expires_at ? new Date(body.web_booking_token_expires_at) : null,
        linked_appointment_id: body.linked_appointment_id || null,
        status: body.status || 'scheduled',
        is_auto_reminder: body.is_auto_reminder ?? false,
        auto_reminder_sequence: body.auto_reminder_sequence || null,
      }
    })

    return NextResponse.json(convertDatesToStrings(schedule, [...DATE_FIELDS]))
  } catch (error) {
    console.error('通知スケジュール作成エラー:', error)
    return NextResponse.json(
      { error: '通知スケジュールの作成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notification-schedules
 * 通知スケジュールのステータスを更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    // 日付フィールドをDate型に変換
    const data: any = { ...updateData }
    if (data.sent_at) data.sent_at = new Date(data.sent_at)
    if (data.send_datetime) data.send_datetime = new Date(data.send_datetime)
    if (data.updated_at) data.updated_at = new Date(data.updated_at)
    else data.updated_at = new Date()

    const schedule = await prisma.patient_notification_schedules.update({
      where: { id },
      data
    })

    return NextResponse.json(convertDatesToStrings(schedule, [...DATE_FIELDS]))
  } catch (error) {
    console.error('通知スケジュール更新エラー:', error)
    return NextResponse.json(
      { error: '通知スケジュールの更新に失敗しました' },
      { status: 500 }
    )
  }
}
