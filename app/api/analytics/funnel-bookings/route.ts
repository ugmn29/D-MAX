import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign') // 空文字列 = campaignなし
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!clinicId || !utmSource) {
      return NextResponse.json(
        { error: 'clinic_id and utm_source are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // Step1: UTMパラメータで patient_acquisition_sources を検索
    const acquisitionWhere: any = {
      clinic_id: clinicId,
      utm_source: utmSource,
    }
    if (utmMedium) acquisitionWhere.utm_medium = utmMedium
    if (utmCampaign !== null) {
      acquisitionWhere.utm_campaign = utmCampaign === '' ? null : utmCampaign
    }

    const acquisitions = await prisma.patient_acquisition_sources.findMany({
      where: acquisitionWhere,
      select: {
        patient_id: true,
        utm_source: true,
        utm_medium: true,
        utm_campaign: true,
        first_visit_at: true,
      },
    })

    if (acquisitions.length === 0) {
      return NextResponse.json({ success: true, data: { bookings: [], total: 0 } })
    }

    const patientIds = acquisitions.map((a) => a.patient_id)

    // Step2: 対象患者の予約を取得
    const appointmentWhere: any = {
      clinic_id: clinicId,
      patient_id: { in: patientIds },
    }
    if (startDate || endDate) {
      appointmentWhere.start_time = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      }
    }

    const appointments = await prisma.appointments.findMany({
      where: appointmentWhere,
      include: {
        treatment_menus_appointments_menu1_idTotreatment_menus: {
          select: { name: true },
        },
        staff_appointments_staff1_idTostaff: {
          select: { name: true },
        },
        patients: {
          select: { last_name: true, first_name: true },
        },
      },
      orderBy: { start_time: 'desc' },
      take: 200,
    })

    // Step3: acquisitions の UTM情報 と appointments を結合
    const acquisitionMap = new Map<string, typeof acquisitions[0]>()
    for (const acq of acquisitions) {
      acquisitionMap.set(acq.patient_id, acq)
    }

    const bookings = appointments.map((appt) => {
      const acq = acquisitionMap.get(appt.patient_id)
      return {
        appointment_id: appt.id,
        patient_id: appt.patient_id,
        patient_name: appt.patients
          ? `${appt.patients.last_name || ''}${appt.patients.first_name || ''}`
          : '—',
        start_time: appt.start_time,
        status: appt.status,
        menu_name: appt.treatment_menus_appointments_menu1_idTotreatment_menus?.name || '-',
        staff_name: appt.staff_appointments_staff1_idTostaff?.name || '-',
        utm_source: acq?.utm_source ?? utmSource,
        utm_medium: acq?.utm_medium ?? utmMedium,
        utm_campaign: acq?.utm_campaign ?? null,
        first_visit_at: acq?.first_visit_at ?? null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        total: bookings.length,
      },
    })
  } catch (error) {
    console.error('funnel-bookings API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
