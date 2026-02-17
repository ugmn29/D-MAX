import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['send_datetime', 'sent_at', 'opened_at', 'clicked_at', 'web_booking_token_expires_at', 'created_at', 'updated_at'] as const

/**
 * GET /api/notification-schedules/[id]
 * 通知スケジュールをIDで取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrismaClient()
    const { id } = params

    const schedule = await prisma.patient_notification_schedules.findUnique({
      where: { id }
    })

    if (!schedule) {
      return NextResponse.json(null)
    }

    return NextResponse.json(convertDatesToStrings(schedule, [...DATE_FIELDS]))
  } catch (error) {
    console.error('通知スケジュール取得エラー:', error)
    return NextResponse.json(
      { error: '通知スケジュールの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notification-schedules/[id]
 * 通知スケジュールを更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrismaClient()
    const { id } = params
    const body = await request.json()

    // 日付フィールドをDateオブジェクトに変換
    const data: any = {
      ...body,
      updated_at: new Date()
    }
    if (data.send_datetime) data.send_datetime = new Date(data.send_datetime)
    if (data.sent_at) data.sent_at = new Date(data.sent_at)
    if (data.opened_at) data.opened_at = new Date(data.opened_at)
    if (data.clicked_at) data.clicked_at = new Date(data.clicked_at)
    if (data.web_booking_token_expires_at) data.web_booking_token_expires_at = new Date(data.web_booking_token_expires_at)

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

/**
 * DELETE /api/notification-schedules/[id]
 * 通知スケジュールを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrismaClient()
    const { id } = params

    await prisma.patient_notification_schedules.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('通知スケジュール削除エラー:', error)
    return NextResponse.json(
      { error: '通知スケジュールの削除に失敗しました' },
      { status: 500 }
    )
  }
}
