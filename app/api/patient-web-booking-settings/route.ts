import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/patient-web-booking-settings?patient_id=xxx&clinic_id=xxx
 * 患者のWeb予約設定を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const clinicId = searchParams.get('clinic_id')

    if (!patientId || !clinicId) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    const settings = await prisma.patient_web_booking_settings.findUnique({
      where: {
        patient_id_clinic_id: {
          patient_id: patientId,
          clinic_id: clinicId
        }
      }
    })

    // 設定が存在しない場合はデフォルト値を返す
    if (!settings) {
      return NextResponse.json({
        patient_id: patientId,
        clinic_id: clinicId,
        web_booking_enabled: true,
        web_cancel_enabled: true,
        web_reschedule_enabled: true,
        web_cancel_limit: null,
        cancel_deadline_hours: null,
        max_concurrent_bookings: null
      })
    }

    const result = convertDatesToStrings(settings, ['created_at', 'updated_at'])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Web予約設定取得エラー:', error)
    return NextResponse.json(
      { error: 'Web予約設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/patient-web-booking-settings?patient_id=xxx&clinic_id=xxx
 * 患者のWeb予約設定を作成または更新（upsert）
 */
export async function PUT(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const clinicId = searchParams.get('clinic_id')
    const body = await request.json()

    // query paramsまたはbodyからIDを取得
    const resolvedPatientId = patientId || body.patient_id
    const resolvedClinicId = clinicId || body.clinic_id

    if (!resolvedPatientId || !resolvedClinicId) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    const {
      web_booking_enabled,
      web_cancel_enabled,
      web_reschedule_enabled,
      web_cancel_limit,
      cancel_deadline_hours,
      max_concurrent_bookings
    } = body

    const updateData: Record<string, any> = {
      updated_at: new Date()
    }
    if (web_booking_enabled !== undefined) updateData.web_booking_enabled = web_booking_enabled
    if (web_cancel_enabled !== undefined) updateData.web_cancel_enabled = web_cancel_enabled
    if (web_reschedule_enabled !== undefined) updateData.web_reschedule_enabled = web_reschedule_enabled
    if (web_cancel_limit !== undefined) updateData.web_cancel_limit = web_cancel_limit
    if (cancel_deadline_hours !== undefined) updateData.cancel_deadline_hours = cancel_deadline_hours
    if (max_concurrent_bookings !== undefined) updateData.max_concurrent_bookings = max_concurrent_bookings

    const settings = await prisma.patient_web_booking_settings.upsert({
      where: {
        patient_id_clinic_id: {
          patient_id: resolvedPatientId,
          clinic_id: resolvedClinicId
        }
      },
      update: updateData,
      create: {
        patient_id: resolvedPatientId,
        clinic_id: resolvedClinicId,
        web_booking_enabled: web_booking_enabled ?? true,
        web_cancel_enabled: web_cancel_enabled ?? true,
        web_reschedule_enabled: web_reschedule_enabled ?? true,
        web_cancel_limit: web_cancel_limit ?? null,
        cancel_deadline_hours: cancel_deadline_hours ?? null,
        max_concurrent_bookings: max_concurrent_bookings ?? null,
        updated_at: new Date()
      }
    })

    const result = convertDatesToStrings(settings, ['created_at', 'updated_at'])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Web予約設定更新エラー:', error)
    return NextResponse.json(
      { error: 'Web予約設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}
