// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, convertArrayDatesToStrings, PatientGender } from '@/lib/prisma-helpers'
import { verifyAuth } from '@/lib/auth/verify-request'
import { writeAuditLog } from '@/lib/audit-log'
import { patientCreateSchema, patientUpdateSchema } from '@/lib/validation/api-schemas'

const DATE_FIELDS = ['created_at', 'updated_at', 'birth_date', 'training_last_login_at'] as const
const DATE_ONLY_FIELDS = ['birth_date'] as const

// password_hash をレスポンスから除外するユーティリティ
function excludePasswordHash<T extends { password_hash?: unknown }>(patient: T): Omit<T, 'password_hash'> {
  const { password_hash: _ph, ...safe } = patient
  return safe as Omit<T, 'password_hash'>
}

// GET: 患者一覧を取得（認証必須）
export async function GET(request: NextRequest) {
  // 認証確認
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    // clinic_id はトークンから強制（クエリパラメータは無視）
    const clinicId = user.clinicId

    const prisma = getPrismaClient()
    const patients = await prisma.patients.findMany({
      where: {
        clinic_id: clinicId
      },
      orderBy: {
        patient_number: 'asc'
      }
    })

    const patientsWithStringDates = convertArrayDatesToStrings(patients, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])
    const safePatients = patientsWithStringDates.map(excludePasswordHash)

    // 患者一覧閲覧を監査ログに記録
    await writeAuditLog({
      clinicId,
      operatorId: user.staffId,
      actionType: 'READ',
      targetTable: 'patients',
    })

    return NextResponse.json(safePatients)
  } catch (error) {
    console.error('[患者API] 一覧取得エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}

// POST: 新しい患者を作成（Web予約から公開 / スタッフからも利用可）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 入力バリデーション（Zod）
    const validation = patientCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: '入力データが不正です', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { clinic_id, last_name, first_name, last_name_kana, first_name_kana,
      birth_date, gender, phone, email } = body
    const { patient_number, is_registered } = body

    const prisma = getPrismaClient()

    // clinic_id が実在するクリニックであることを確認
    const clinic = await prisma.clinics.findUnique({ where: { id: clinic_id } })
    if (!clinic) {
      return NextResponse.json({ error: '指定されたクリニックが見つかりません' }, { status: 400 })
    }

    // 認証済みスタッフの場合はclinic_idを強制
    let operatorId: string | null = null
    try {
      const user = await verifyAuth(request)
      if (user.clinicId !== clinic_id) {
        return NextResponse.json({ error: 'このクリニックへのアクセス権限がありません' }, { status: 403 })
      }
      operatorId = user.staffId ?? null
    } catch {
      // Web予約からの非認証アクセスは許可（operatorIdはnull）
    }

    // 診察券番号の生成（指定がない場合は連番で自動生成）
    let assignedPatientNumber = patient_number ? Number(patient_number) : null
    if (!assignedPatientNumber) {
      const existingPatients = await prisma.patients.findMany({
        where: { clinic_id, patient_number: { not: null } },
        select: { patient_number: true },
        orderBy: { patient_number: 'asc' }
      })
      const numbers = existingPatients.map(p => p.patient_number as number).sort((a, b) => a - b)
      assignedPatientNumber = numbers.length + 1
      for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] !== i + 1) {
          assignedPatientNumber = i + 1
          break
        }
      }
    }

    const patient = await prisma.patients.create({
      data: {
        clinic_id,
        patient_number: assignedPatientNumber,
        last_name,
        first_name: first_name || '',
        last_name_kana: last_name_kana || null,
        first_name_kana: first_name_kana || null,
        birth_date: birth_date ? new Date(birth_date) : null,
        gender: gender ? PatientGender.fromDb(gender) : null,
        phone: phone || null,
        email: email || null,
        is_registered: is_registered !== undefined ? is_registered : false
      }
    })

    // 監査ログ（スタッフによる作成のみ記録）
    if (operatorId) {
      await writeAuditLog({
        clinicId: clinic_id,
        operatorId,
        actionType: 'CREATE',
        targetTable: 'patients',
        targetRecordId: patient.id,
        afterData: { patient_number: patient.patient_number, last_name, first_name },
      })
    }

    const patientWithStringDates = convertDatesToStrings(patient, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])
    return NextResponse.json(excludePasswordHash(patientWithStringDates))
  } catch (error) {
    console.error('[患者API] 作成エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}

// PUT: 患者を更新（認証必須）
export async function PUT(request: NextRequest) {
  // 認証確認
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      id,
      last_name,
      first_name,
      last_name_kana,
      first_name_kana,
      birth_date,
      gender,
      phone,
      email,
      is_registered
    } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // 入力バリデーション
    const validation = patientUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: '入力データが不正です', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 更新前のレコードを取得（監査ログ用 + clinic_id確認）
    const existing = await prisma.patients.findFirst({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    if (existing.clinic_id !== user.clinicId) {
      return NextResponse.json({ error: 'このクリニックへのアクセス権限がありません' }, { status: 403 })
    }

    const updateData: any = { updated_at: new Date() }

    if (last_name !== undefined) updateData.last_name = last_name
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name_kana !== undefined) updateData.last_name_kana = last_name_kana || null
    if (first_name_kana !== undefined) updateData.first_name_kana = first_name_kana || null
    if (birth_date !== undefined) updateData.birth_date = birth_date ? new Date(birth_date) : null
    if (gender !== undefined) updateData.gender = gender ? PatientGender.fromDb(gender) : null
    if (phone !== undefined) updateData.phone = phone || null
    if (email !== undefined) updateData.email = email || null
    if (is_registered !== undefined) updateData.is_registered = is_registered

    const patient = await prisma.patients.update({
      where: { id },
      data: updateData
    })

    // 監査ログ（before/after付き）
    await writeAuditLog({
      clinicId: user.clinicId,
      operatorId: user.staffId,
      actionType: 'UPDATE',
      targetTable: 'patients',
      targetRecordId: id,
      beforeData: { last_name: existing.last_name, first_name: existing.first_name, phone: existing.phone, email: existing.email },
      afterData: { last_name: patient.last_name, first_name: patient.first_name, phone: patient.phone, email: patient.email },
    })

    const patientWithStringDates = convertDatesToStrings(patient, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])
    return NextResponse.json(excludePasswordHash(patientWithStringDates))
  } catch (error: any) {
    console.error('[患者API] 更新エラー:', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}

// DELETE: 患者を削除（認証必須）
export async function DELETE(request: NextRequest) {
  // 認証確認
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // 削除前に所有権を確認（監査ログ用）
    const existing = await prisma.patients.findFirst({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    if (existing.clinic_id !== user.clinicId) {
      return NextResponse.json({ error: 'このクリニックへのアクセス権限がありません' }, { status: 403 })
    }

    await prisma.patients.delete({ where: { id } })

    // 監査ログ（削除前データ付き）
    await writeAuditLog({
      clinicId: user.clinicId,
      operatorId: user.staffId,
      actionType: 'DELETE',
      targetTable: 'patients',
      targetRecordId: id,
      beforeData: { last_name: existing.last_name, first_name: existing.first_name, patient_number: existing.patient_number },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[患者API] 削除エラー:', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}
