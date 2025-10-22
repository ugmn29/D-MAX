import { NextRequest, NextResponse } from 'next/server'
import {
  getPatientNotificationPreferences,
  upsertPatientNotificationPreferences
} from '@/lib/api/patient-notification-preferences'

// GET: 患者の通知受信設定を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const patientId = searchParams.get('patient_id')
    const clinicId = searchParams.get('clinic_id')

    if (!patientId || !clinicId) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    const preferences = await getPatientNotificationPreferences(patientId, clinicId)

    // 設定が存在しない場合はデフォルト値を返す
    if (!preferences) {
      return NextResponse.json({
        patient_id: patientId,
        clinic_id: clinicId,
        appointment_reminder: true,
        periodic_checkup: true,
        treatment_reminder: true,
        appointment_change: true,
        custom: true
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching patient notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient notification preferences' },
      { status: 500 }
    )
  }
}

// PUT: 患者の通知受信設定を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patient_id,
      clinic_id,
      appointment_reminder,
      periodic_checkup,
      treatment_reminder,
      appointment_change,
      custom
    } = body

    if (!patient_id || !clinic_id) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    const preferences = await upsertPatientNotificationPreferences(
      patient_id,
      clinic_id,
      {
        appointment_reminder,
        periodic_checkup,
        treatment_reminder,
        appointment_change,
        custom
      }
    )

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating patient notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update patient notification preferences' },
      { status: 500 }
    )
  }
}
