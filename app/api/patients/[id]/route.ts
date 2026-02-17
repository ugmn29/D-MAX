// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, PatientGender } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at', 'birth_date', 'training_last_login_at', 'migrated_at', 'last_insurance_verification_date'] as const
const DATE_ONLY_FIELDS = ['birth_date'] as const

// GET: 患者詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが指定されていません' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const whereClause: any = { id: patientId }
    if (clinicId) {
      whereClause.clinic_id = clinicId
    }

    const patient = await prisma.patients.findFirst({
      where: whereClause
    })

    if (!patient) {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    const patientWithStringDates = convertDatesToStrings(patient, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])

    return NextResponse.json(patientWithStringDates)
  } catch (error) {
    console.error('患者情報取得エラー:', error)
    return NextResponse.json(
      { error: '患者情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: 患者情報を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const body = await request.json()
    const { clinic_id, ...updateFields } = body

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが指定されていません' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 更新データを構築
    const updateData: any = {
      updated_at: new Date()
    }

    // フィールドのマッピングと設定
    const directFields = [
      'last_name', 'first_name', 'last_name_kana', 'first_name_kana',
      'phone', 'email', 'postal_code', 'prefecture', 'city', 'address_line',
      'address', 'allergies', 'medical_history', 'medications', 'visit_reason',
      'is_registered', 'primary_doctor_id', 'primary_hygienist_id',
      'treatment_memo', 'alert_notes', 'patient_number',
      'preferred_contact_method', 'auto_reminder_enabled',
      'auto_reminder_custom_intervals', 'notification_preferences',
      'legacy_patient_number', 'legacy_system_name',
      'insurance_verification_status', 'copay_rate'
    ]

    for (const field of directFields) {
      if (updateFields[field] !== undefined) {
        // 空文字列をnullに変換（制約対策）
        if (updateFields[field] === '' && ['preferred_contact_method', 'gender', 'email', 'birth_date'].includes(field)) {
          updateData[field] = null
        } else {
          updateData[field] = updateFields[field]
        }
      }
    }

    // 日付フィールドの変換
    if (updateFields.birth_date !== undefined) {
      updateData.birth_date = updateFields.birth_date ? new Date(updateFields.birth_date) : null
    }

    // gender enumの変換
    if (updateFields.gender !== undefined) {
      updateData.gender = updateFields.gender ? PatientGender.fromDb(updateFields.gender) : null
    }

    // フィールド名マッピング（旧名 -> 新名）
    if (updateFields.assigned_dh !== undefined) {
      updateData.primary_hygienist_id = updateFields.assigned_dh || null
    }
    if (updateFields.primary_doctor !== undefined) {
      updateData.primary_doctor_id = updateFields.primary_doctor || null
    }

    // 仮登録に戻す場合、診察券番号をnullにして番号を解放
    if (updateFields.is_registered === false) {
      updateData.patient_number = null
    }

    // Prismaで更新
    const whereClause: any = { id: patientId }

    const patient = await prisma.patients.update({
      where: whereClause,
      data: updateData
    })

    const patientWithStringDates = convertDatesToStrings(patient, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])

    return NextResponse.json(patientWithStringDates)
  } catch (error: any) {
    console.error('患者更新エラー:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '患者情報の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: 患者を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが指定されていません' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // clinic_idが指定されている場合、まず患者が該当クリニックに属するか確認
    if (clinicId) {
      const existing = await prisma.patients.findFirst({
        where: { id: patientId, clinic_id: clinicId }
      })
      if (!existing) {
        return NextResponse.json(
          { error: '患者が見つかりません' },
          { status: 404 }
        )
      }
    }

    await prisma.patients.delete({
      where: { id: patientId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('患者削除エラー:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '患者の削除に失敗しました' },
      { status: 500 }
    )
  }
}
