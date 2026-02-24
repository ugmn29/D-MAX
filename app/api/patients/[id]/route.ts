// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, PatientGender } from '@/lib/prisma-helpers'
import { verifyAuth } from '@/lib/auth/verify-request'
import { writeAuditLog } from '@/lib/audit-log'
import { patientUpdateSchema } from '@/lib/validation/api-schemas'

const DATE_FIELDS = ['created_at', 'updated_at', 'birth_date', 'training_last_login_at', 'migrated_at', 'last_insurance_verification_date'] as const
const DATE_ONLY_FIELDS = ['birth_date'] as const

function excludePasswordHash<T extends { password_hash?: unknown }>(patient: T): Omit<T, 'password_hash'> {
  const { password_hash: _ph, ...safe } = patient
  return safe as Omit<T, 'password_hash'>
}

// GET: 患者詳細を取得（認証必須）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 認証確認
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが指定されていません' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // clinic_id をトークンから強制（他クリニックの患者へのアクセスを阻止）
    const patient = await prisma.patients.findFirst({
      where: { id: patientId, clinic_id: user.clinicId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    // 監査ログ
    await writeAuditLog({
      clinicId: user.clinicId,
      operatorId: user.staffId,
      actionType: 'READ',
      targetTable: 'patients',
      targetRecordId: patientId,
    })

    const patientWithStringDates = convertDatesToStrings(patient, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])
    return NextResponse.json(excludePasswordHash(patientWithStringDates))
  } catch (error) {
    console.error('[患者詳細API] 取得エラー:', error)
    return NextResponse.json(
      { error: '処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// PUT: 患者情報を更新（認証必須）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 認証確認
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

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

    // 入力バリデーション
    const validation = patientUpdateSchema.safeParse(updateFields)
    if (!validation.success) {
      return NextResponse.json(
        { error: '入力データが不正です', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 更新前のレコードを取得（所有権確認 + 監査ログ用）
    const existing = await prisma.patients.findFirst({
      where: { id: patientId, clinic_id: user.clinicId }
    })
    if (!existing) {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    // 更新データを構築
    const updateData: any = {
      updated_at: new Date()
    }

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
        if (updateFields[field] === '' && ['preferred_contact_method', 'gender', 'email', 'birth_date'].includes(field)) {
          updateData[field] = null
        } else {
          updateData[field] = updateFields[field]
        }
      }
    }

    if (updateFields.birth_date !== undefined) {
      updateData.birth_date = updateFields.birth_date ? new Date(updateFields.birth_date) : null
    }

    if (updateFields.gender !== undefined) {
      updateData.gender = updateFields.gender ? PatientGender.fromDb(updateFields.gender) : null
    }

    if (updateFields.assigned_dh !== undefined) {
      updateData.primary_hygienist_id = updateFields.assigned_dh || null
    }
    if (updateFields.primary_doctor !== undefined) {
      updateData.primary_doctor_id = updateFields.primary_doctor || null
    }

    if (updateFields.is_registered === false) {
      updateData.patient_number = null
    }

    const patient = await prisma.patients.update({
      where: { id: patientId },
      data: updateData
    })

    // 監査ログ（before/after付き）
    await writeAuditLog({
      clinicId: user.clinicId,
      operatorId: user.staffId,
      actionType: 'UPDATE',
      targetTable: 'patients',
      targetRecordId: patientId,
      beforeData: { last_name: existing.last_name, first_name: existing.first_name, phone: existing.phone, email: existing.email },
      afterData: { last_name: patient.last_name, first_name: patient.first_name, phone: patient.phone, email: patient.email },
    })

    const patientWithStringDates = convertDatesToStrings(patient, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])
    return NextResponse.json(excludePasswordHash(patientWithStringDates))
  } catch (error: any) {
    console.error('[患者詳細API] 更新エラー:', error)
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: '処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// DELETE: 患者を削除（認証必須）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 認証確認
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが指定されていません' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 削除前に所有権を確認（監査ログ用）
    const existing = await prisma.patients.findFirst({
      where: { id: patientId, clinic_id: user.clinicId }
    })
    if (!existing) {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    await prisma.patients.delete({
      where: { id: patientId }
    })

    // 監査ログ（削除前データ付き）
    await writeAuditLog({
      clinicId: user.clinicId,
      operatorId: user.staffId,
      actionType: 'DELETE',
      targetTable: 'patients',
      targetRecordId: patientId,
      beforeData: { last_name: existing.last_name, first_name: existing.first_name, patient_number: existing.patient_number },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[患者詳細API] 削除エラー:', error)
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: '処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
