import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['failed_at'] as const

/**
 * GET /api/notification-failure-logs
 * 通知送信失敗ログを取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const patientId = searchParams.get('patient_id')
    const notificationScheduleId = searchParams.get('notification_schedule_id')

    const where: any = {}
    if (clinicId) where.clinic_id = clinicId
    if (patientId) where.patient_id = patientId
    if (notificationScheduleId) where.notification_schedule_id = notificationScheduleId

    const logs = await prisma.notification_failure_logs.findMany({
      where,
      orderBy: { failed_at: 'desc' }
    })

    const mapped = logs.map(l => convertDatesToStrings(l, [...DATE_FIELDS]))
    return NextResponse.json(mapped)
  } catch (error) {
    console.error('通知失敗ログ取得エラー:', error)
    return NextResponse.json(
      { error: '通知失敗ログの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notification-failure-logs
 * 通知送信失敗ログを記録
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()

    const log = await prisma.notification_failure_logs.create({
      data: {
        notification_schedule_id: body.notification_schedule_id || null,
        patient_id: body.patient_id,
        clinic_id: body.clinic_id,
        attempted_channel: body.send_channel || body.attempted_channel || null,
        failure_reason: body.error_message || body.failure_reason || null,
        failure_type: body.failure_type || null,
        is_retryable: body.is_retryable ?? true,
        retry_with_fallback: body.retry_with_fallback ?? false,
      }
    })

    return NextResponse.json(convertDatesToStrings(log, [...DATE_FIELDS]))
  } catch (error) {
    console.error('通知失敗ログ記録エラー:', error)
    return NextResponse.json(
      { error: '通知失敗ログの記録に失敗しました' },
      { status: 500 }
    )
  }
}
