import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'
import { NextRequest, NextResponse } from 'next/server'

// POST - 視診検査を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patient_id, clinic_id, examination_date, notes, tooth_data } = body
    const prisma = getPrismaClient()

    // 視診検査レコードを作成
    const exam = await prisma.visual_examinations.create({
      data: {
        patient_id,
        clinic_id,
        examination_date: examination_date ? new Date(examination_date) : new Date(),
        notes,
      },
    })

    // 歯牙データを作成
    const toothDataWithExamId = tooth_data.map((tooth: any) => ({
      ...tooth,
      examination_id: exam.id,
    }))

    const toothDataResult = await Promise.all(
      toothDataWithExamId.map((tooth: any) =>
        prisma.visual_tooth_data.create({ data: tooth })
      )
    )

    const examConverted = convertDatesToStrings(exam, ['examination_date', 'created_at', 'updated_at'])
    const toothConverted = toothDataResult.map(t =>
      convertDatesToStrings(t, ['created_at'])
    )

    return NextResponse.json({
      ...examConverted,
      tooth_data: toothConverted,
    })
  } catch (error) {
    console.error('Error in POST /api/visual-examinations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - 患者の視診検査一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const exams = await prisma.visual_examinations.findMany({
      where: { patient_id: patientId },
      orderBy: { examination_date: 'desc' },
    })

    // 各検査の歯牙データを取得
    const examsWithToothData = await Promise.all(
      exams.map(async (exam) => {
        const toothData = await prisma.visual_tooth_data.findMany({
          where: { examination_id: exam.id },
          orderBy: { tooth_number: 'asc' },
        })

        const examConverted = convertDatesToStrings(exam, ['examination_date', 'created_at', 'updated_at'])
        const toothConverted = toothData.map(t =>
          convertDatesToStrings(t, ['created_at'])
        )

        return {
          ...examConverted,
          tooth_data: toothConverted,
        }
      })
    )

    return NextResponse.json(examsWithToothData)
  } catch (error) {
    console.error('Error in GET /api/visual-examinations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
