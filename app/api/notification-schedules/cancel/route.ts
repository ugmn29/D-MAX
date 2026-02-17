import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * POST /api/notification-schedules/cancel
 * 通知スケジュールをキャンセル
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { patient_id, clinic_id, linked_appointment_id, is_auto_reminder } = body

    const where: any = {
      status: 'scheduled'
    }
    if (patient_id) where.patient_id = patient_id
    if (clinic_id) where.clinic_id = clinic_id
    if (linked_appointment_id) where.linked_appointment_id = linked_appointment_id
    if (is_auto_reminder !== undefined) where.is_auto_reminder = is_auto_reminder

    const result = await prisma.patient_notification_schedules.updateMany({
      where,
      data: { status: 'cancelled' }
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error('通知スケジュールキャンセルエラー:', error)
    return NextResponse.json(
      { error: '通知スケジュールのキャンセルに失敗しました' },
      { status: 500 }
    )
  }
}
