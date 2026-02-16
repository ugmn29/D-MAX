import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const SCHEDULE_DATE_FIELDS = ['send_datetime', 'sent_at', 'opened_at', 'clicked_at', 'web_booking_token_expires_at', 'created_at', 'updated_at'] as const

/**
 * GET /api/notification-sender/scheduled
 * 送信予定の通知を取得（patients結合付き）
 *
 * Query params:
 *   clinic_id: string (required)
 *   limit: number (optional, default 100)
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 100

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const now = new Date()

    const schedules = await prisma.patient_notification_schedules.findMany({
      where: {
        clinic_id: clinicId,
        status: 'scheduled',
        send_datetime: {
          lte: now
        }
      },
      include: {
        patients: {
          select: {
            id: true,
            last_name: true,
            first_name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { send_datetime: 'asc' },
      take: limit
    })

    const mapped = schedules.map(s => {
      const converted = convertDatesToStrings(s, [...SCHEDULE_DATE_FIELDS])
      return {
        ...converted,
        patients: s.patients ? {
          id: s.patients.id,
          last_name: s.patients.last_name,
          first_name: s.patients.first_name,
          email: s.patients.email,
          phone: s.patients.phone
        } : null
      }
    })

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('送信予定通知取得エラー:', error)
    return NextResponse.json(
      { error: '送信予定通知の取得に失敗しました' },
      { status: 500 }
    )
  }
}
