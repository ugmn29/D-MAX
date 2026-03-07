/**
 * Web予約用 公開予約取得API（認証不要）
 * スロット計算に必要な最小限のフィールドのみ返す
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma/client'

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
        duration: true,
      },
      orderBy: [
        { appointment_date: 'asc' },
        { start_time: 'asc' }
      ]
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('[web-booking/appointments] 取得エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}
