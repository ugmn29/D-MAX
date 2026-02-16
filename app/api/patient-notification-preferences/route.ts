import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/patient-notification-preferences?patient_id=xxx&clinic_id=xxx
 * 患者の通知受信設定を取得
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

    const preferences = await prisma.patient_notification_preferences.findUnique({
      where: {
        patient_id_clinic_id: {
          patient_id: patientId,
          clinic_id: clinicId
        }
      }
    })

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

    const result = convertDatesToStrings(preferences, ['created_at', 'updated_at'])

    return NextResponse.json(result)
  } catch (error) {
    console.error('患者通知設定取得エラー:', error)
    return NextResponse.json(
      { error: '患者通知設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/patient-notification-preferences?patient_id=xxx&clinic_id=xxx
 * 患者の通知受信設定を作成または更新（upsert）
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
      appointment_reminder,
      periodic_checkup,
      treatment_reminder,
      appointment_change,
      custom
    } = body

    const updateData: Record<string, any> = {
      updated_at: new Date()
    }
    if (appointment_reminder !== undefined) updateData.appointment_reminder = appointment_reminder
    if (periodic_checkup !== undefined) updateData.periodic_checkup = periodic_checkup
    if (treatment_reminder !== undefined) updateData.treatment_reminder = treatment_reminder
    if (appointment_change !== undefined) updateData.appointment_change = appointment_change
    if (custom !== undefined) updateData.custom = custom

    const preferences = await prisma.patient_notification_preferences.upsert({
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
        appointment_reminder: appointment_reminder ?? true,
        periodic_checkup: periodic_checkup ?? true,
        treatment_reminder: treatment_reminder ?? true,
        appointment_change: appointment_change ?? true,
        custom: custom ?? true,
        updated_at: new Date()
      }
    })

    const result = convertDatesToStrings(preferences, ['created_at', 'updated_at'])

    return NextResponse.json(result)
  } catch (error) {
    console.error('患者通知設定更新エラー:', error)
    return NextResponse.json(
      { error: '患者通知設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}
