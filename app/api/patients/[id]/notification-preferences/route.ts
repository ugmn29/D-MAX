// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/patients/[id]/notification-preferences?clinic_id=xxx
 * 患者の通知受信設定を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

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
    console.error('患者通知設定取得API エラー:', error)
    return NextResponse.json(
      { error: '患者通知設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/patients/[id]/notification-preferences?clinic_id=xxx
 * 患者の通知受信設定を作成または更新（upsert）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const body = await request.json()

    // query paramsまたはbodyからclinic_idを取得
    const resolvedClinicId = clinicId || body.clinic_id

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    if (!resolvedClinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
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

    const prisma = getPrismaClient()

    const preferences = await prisma.patient_notification_preferences.upsert({
      where: {
        patient_id_clinic_id: {
          patient_id: patientId,
          clinic_id: resolvedClinicId
        }
      },
      update: updateData,
      create: {
        patient_id: patientId,
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
    console.error('患者通知設定更新API エラー:', error)
    return NextResponse.json(
      { error: '患者通知設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}
