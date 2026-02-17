// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertArrayDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at', 'birth_date', 'training_last_login_at'] as const
const DATE_ONLY_FIELDS = ['birth_date'] as const

// GET: 患者の連携状況を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // 仮登録患者（未連携）を取得
    const unlinkedPatients = await prisma.patients.findMany({
      where: {
        clinic_id: clinicId,
        is_registered: false
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // 本登録患者（連携済み）を取得
    const linkedPatients = await prisma.patients.findMany({
      where: {
        clinic_id: clinicId,
        is_registered: true
      },
      orderBy: {
        updated_at: 'desc'
      }
    })

    return NextResponse.json({
      unlinkedPatients: convertArrayDatesToStrings(unlinkedPatients, [...DATE_FIELDS], [...DATE_ONLY_FIELDS]),
      linkedPatients: convertArrayDatesToStrings(linkedPatients, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])
    })
  } catch (error) {
    console.error('連携状況API エラー:', error)
    return NextResponse.json({
      unlinkedPatients: [],
      linkedPatients: []
    })
  }
}

// POST: 患者を連携（本登録に変更）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId } = body

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // 1. 連携前の患者データを取得して保存（解除時の復元用）
    const currentPatient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        last_name: true,
        first_name: true,
        last_name_kana: true,
        first_name_kana: true,
        birth_date: true,
        gender: true,
        phone: true,
        email: true,
        postal_code: true,
        address: true,
        allergies: true,
        medical_history: true,
        medications: true,
        visit_reason: true,
        preferred_contact_method: true
      }
    })

    if (!currentPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // 2. この患者に紐づいている問診票に元データを保存
    const originalData = {
      ...currentPatient,
      birth_date: currentPatient.birth_date ? currentPatient.birth_date.toISOString() : null
    }

    await prisma.questionnaire_responses.updateMany({
      where: { patient_id: patientId },
      data: {
        original_patient_data: originalData,
        updated_at: new Date()
      }
    })

    // 3. 患者を本登録に変更
    const patient = await prisma.patients.update({
      where: { id: patientId },
      data: {
        is_registered: true,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ success: true, patient })
  } catch (error: any) {
    console.error('患者連携API エラー:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 患者の連携を解除（仮登録に戻す）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // 1. この患者に紐づいている問診票から元の患者データを取得
    const responses = await prisma.questionnaire_responses.findMany({
      where: { patient_id: patientId },
      select: {
        id: true,
        original_patient_data: true
      },
      take: 1
    })

    // 2. 元のデータが存在する場合は患者情報を復元
    if (responses.length > 0 && responses[0].original_patient_data) {
      const originalData = responses[0].original_patient_data as any

      const restoreData: any = {
        is_registered: false,
        updated_at: new Date()
      }

      const fieldsToRestore = [
        'last_name', 'first_name', 'last_name_kana', 'first_name_kana',
        'phone', 'email', 'postal_code', 'address',
        'allergies', 'medical_history', 'medications', 'visit_reason',
        'preferred_contact_method'
      ]

      fieldsToRestore.forEach(field => {
        if (field in originalData) {
          restoreData[field] = originalData[field]
        }
      })

      // 日付フィールドの復元
      if ('birth_date' in originalData) {
        restoreData.birth_date = originalData.birth_date ? new Date(originalData.birth_date) : null
      }

      // genderの復元
      if ('gender' in originalData) {
        restoreData.gender = originalData.gender || null
      }

      await prisma.patients.update({
        where: { id: patientId },
        data: restoreData
      })
    } else {
      // 元データがない場合はis_registeredだけ更新
      await prisma.patients.update({
        where: { id: patientId },
        data: {
          is_registered: false,
          updated_at: new Date()
        }
      })
    }

    // 3. この患者に紐づいている問診票のpatient_idをnullに戻し、original_patient_dataもクリア
    await prisma.questionnaire_responses.updateMany({
      where: { patient_id: patientId },
      data: {
        patient_id: null,
        original_patient_data: null as any,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('患者連携解除API エラー:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
