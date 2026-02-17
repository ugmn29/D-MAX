// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, convertArrayDatesToStrings, PatientGender } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at', 'birth_date', 'training_last_login_at'] as const
const DATE_ONLY_FIELDS = ['birth_date'] as const

// GET: 患者一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    // Prismaで患者一覧を取得
    const prisma = getPrismaClient()
    const patients = await prisma.patients.findMany({
      where: {
        clinic_id: clinicId
      },
      orderBy: {
        patient_number: 'asc'
      }
    })

    // Date型をISO文字列に変換
    const patientsWithStringDates = convertArrayDatesToStrings(patients, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])

    return NextResponse.json(patientsWithStringDates)
  } catch (error) {
    console.error('患者API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 新しい患者を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      patient_number,
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

    if (!clinic_id || !last_name) {
      return NextResponse.json({
        error: 'clinic_id and last_name are required'
      }, { status: 400 })
    }

    // Prismaで患者を作成
    const prisma = getPrismaClient()

    // 診察券番号の生成（指定がない場合は連番で自動生成）
    let assignedPatientNumber = patient_number ? Number(patient_number) : null
    if (!assignedPatientNumber) {
      const existingPatients = await prisma.patients.findMany({
        where: { clinic_id, patient_number: { not: null } },
        select: { patient_number: true },
        orderBy: { patient_number: 'asc' }
      })
      const numbers = existingPatients.map(p => p.patient_number as number).sort((a, b) => a - b)
      // 欠番を探す
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

    // Date型をISO文字列に変換
    const patientWithStringDates = convertDatesToStrings(patient, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])

    return NextResponse.json(patientWithStringDates)
  } catch (error) {
    console.error('患者作成API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: 患者を更新
export async function PUT(request: NextRequest) {
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

    // Prismaで患者を更新
    const prisma = getPrismaClient()

    // 更新データを構築
    const updateData: any = {
      updated_at: new Date()
    }

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

    // Date型をISO文字列に変換
    const patientWithStringDates = convertDatesToStrings(patient, [...DATE_FIELDS], [...DATE_ONLY_FIELDS])

    return NextResponse.json(patientWithStringDates)
  } catch (error: any) {
    console.error('患者更新API エラー:', error)

    // Prisma P2025エラー: Record not found
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 患者を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Prismaで患者を削除
    const prisma = getPrismaClient()
    await prisma.patients.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('患者削除API エラー:', error)

    // Prisma P2025エラー: Record not found
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
  }
}
