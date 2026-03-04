import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * 電話番号でweb予約NG状態を確認するAPI（初診フロー用）
 * GET /api/patients/check-booking-status?phone=09012345678&clinic_id=xxx
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')
  const clinicId = searchParams.get('clinic_id')

  if (!phone || !clinicId) {
    return NextResponse.json({ error: 'phone and clinic_id are required' }, { status: 400 })
  }

  try {
    const prisma = getPrismaClient()

    const patient = await prisma.patients.findFirst({
      where: {
        clinic_id: clinicId,
        phone: phone,
      },
      select: {
        id: true,
        patient_web_booking_settings: {
          select: { web_booking_enabled: true },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ blocked: false })
    }

    const settings = patient.patient_web_booking_settings[0]
    const blocked = settings ? !settings.web_booking_enabled : false

    return NextResponse.json({ blocked })
  } catch (error) {
    console.error('check-booking-status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
