import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/lip-closure-tests?patient_id=xxx&clinic_id=yyy
// 口唇閉鎖検査記録を取得
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patient_id')
    const clinicId = searchParams.get('clinic_id')

    if (!patientId || !clinicId) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    const tests = await prisma.lip_closure_tests.findMany({
      where: {
        patient_id: patientId,
        clinic_id: clinicId,
      },
      orderBy: {
        test_date: 'desc',
      },
    })

    const result = tests.map((test) => ({
      id: test.id,
      patient_id: test.patient_id,
      clinic_id: test.clinic_id,
      test_date: test.test_date.toISOString(),
      measurement_value: Number(test.measurement_value),
      notes: test.notes,
      examiner_id: test.examiner_id,
      created_at: test.created_at?.toISOString() || null,
    }))

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('口唇閉鎖検査記録取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/training/lip-closure-tests
// 口唇閉鎖検査記録を保存
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await req.json()

    const { patient_id, clinic_id, measurement_value, notes, examiner_id } = body

    if (!patient_id || !clinic_id || measurement_value === undefined) {
      return NextResponse.json(
        { error: 'patient_id, clinic_id, and measurement_value are required' },
        { status: 400 }
      )
    }

    const test = await prisma.lip_closure_tests.create({
      data: {
        patient_id,
        clinic_id,
        test_date: new Date(),
        measurement_value,
        notes: notes || null,
        examiner_id: examiner_id || null,
      },
    })

    return NextResponse.json({
      data: {
        ...test,
        test_date: test.test_date.toISOString(),
        measurement_value: Number(test.measurement_value),
        created_at: test.created_at?.toISOString() || null,
      },
    })
  } catch (error: any) {
    console.error('口唇閉鎖検査記録保存エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/training/lip-closure-tests?id=xxx
// 口唇閉鎖検査記録を削除
export async function DELETE(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.lip_closure_tests.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('口唇閉鎖検査記録削除エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
