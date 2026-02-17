import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'
import { NextRequest, NextResponse } from 'next/server'

// GET - 最新の視診検査を取得
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

    const exam = await prisma.visual_examinations.findFirst({
      where: { patient_id: patientId },
      orderBy: { examination_date: 'desc' },
    })

    if (!exam) {
      // No rows found
      return NextResponse.json(null)
    }

    const toothData = await prisma.visual_tooth_data.findMany({
      where: { examination_id: exam.id },
      orderBy: { tooth_number: 'asc' },
    })

    const examConverted = convertDatesToStrings(exam, ['examination_date', 'created_at', 'updated_at'])
    const toothConverted = toothData.map(t =>
      convertDatesToStrings(t, ['created_at'])
    )

    return NextResponse.json({
      ...examConverted,
      tooth_data: toothConverted,
    })
  } catch (error) {
    console.error('Error in GET /api/visual-examinations/latest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
