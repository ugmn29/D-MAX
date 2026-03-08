/**
 * Web予約用 公開予約取得API（認証不要）
 * スロット計算に必要な最小限のフィールドのみ返す
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma/client'

const STATUS_MAP: Record<string, string> = {
  'NOT_YET_ARRIVED': '未来院',
  'LATE': '遅刻',
  'CHECKED_IN': '来院済み',
  'IN_TREATMENT': '診療中',
  'PAYMENT': '会計',
  'COMPLETED': '終了',
  'CANCELLED': 'キャンセル',
}

function formatTime(time: Date | null | undefined): string | null {
  if (!time) return null
  return time.toISOString().substring(11, 16)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    const where: any = { clinic_id: clinicId }

    if (startDate) {
      where.appointment_date = {
        ...where.appointment_date,
        gte: new Date(startDate)
      }
    }
    if (endDate) {
      where.appointment_date = {
        ...where.appointment_date,
        lte: new Date(endDate)
      }
    }

    const appointments = await prisma.appointments.findMany({
      where,
      select: {
        id: true,
        appointment_date: true,
        start_time: true,
        end_time: true,
        status: true,
        staff1_id: true,
        staff2_id: true,
        staff3_id: true,
        unit_id: true,
        is_block: true,
      },
      orderBy: [
        { appointment_date: 'asc' },
        { start_time: 'asc' }
      ]
    })

    const result = appointments.map((apt) => ({
      ...apt,
      appointment_date: apt.appointment_date.toISOString().split('T')[0], // YYYY-MM-DD
      start_time: formatTime(apt.start_time),
      end_time: formatTime(apt.end_time),
      status: apt.status ? (STATUS_MAP[apt.status] ?? apt.status) : null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('[web-booking/appointments] 取得エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}
