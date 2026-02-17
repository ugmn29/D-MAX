import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'
import { NextRequest, NextResponse } from 'next/server'

// GET - 特定の歯周検査を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const prisma = getPrismaClient()

    // 検査レコードを取得
    const exam = await prisma.periodontal_examinations.findUnique({
      where: { id: examId },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Periodontal examination not found' }, { status: 404 })
    }

    // 歯牙データを取得
    const toothData = await prisma.periodontal_tooth_data.findMany({
      where: { examination_id: examId },
      orderBy: { tooth_number: 'asc' },
    })

    const examConverted = convertDatesToStrings(exam, ['examination_date', 'created_at', 'updated_at'])
    const toothConverted = toothData.map(t =>
      convertDatesToStrings(t, ['created_at', 'updated_at'])
    )

    return NextResponse.json({
      ...examConverted,
      tooth_data: toothConverted,
    })
  } catch (error) {
    console.error('Error in GET /api/periodontal-exams/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 歯周検査を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const body = await request.json()
    const { examination_date, measurement_type, notes, tooth_data } = body
    const prisma = getPrismaClient()

    // 検査レコードを更新（更新項目がある場合のみ）
    const updateData: any = {}
    if (examination_date !== undefined) updateData.examination_date = new Date(examination_date)
    if (measurement_type !== undefined) updateData.measurement_type = measurement_type
    if (notes !== undefined) updateData.notes = notes

    let exam
    if (Object.keys(updateData).length > 0) {
      // 更新項目がある場合は更新
      exam = await prisma.periodontal_examinations.update({
        where: { id: examId },
        data: updateData,
      })
    } else {
      // 更新項目がない場合は既存のレコードを取得
      exam = await prisma.periodontal_examinations.findUnique({
        where: { id: examId },
      })

      if (!exam) {
        return NextResponse.json({ error: 'Periodontal examination not found' }, { status: 404 })
      }
    }

    // 歯牙データを更新
    if (tooth_data) {
      // 既存のデータを削除
      await prisma.periodontal_tooth_data.deleteMany({
        where: { examination_id: examId },
      })

      // 新しいデータを挿入
      if (tooth_data.length > 0) {
        const toothDataWithExamId = tooth_data.map((tooth: any) => ({
          ...tooth,
          examination_id: examId,
        }))

        await Promise.all(
          toothDataWithExamId.map((tooth: any) =>
            prisma.periodontal_tooth_data.create({ data: tooth })
          )
        )
      }
    }

    const examConverted = convertDatesToStrings(exam, ['examination_date', 'created_at', 'updated_at'])
    return NextResponse.json(examConverted)
  } catch (error) {
    console.error('Error in PUT /api/periodontal-exams/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 歯周検査を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const prisma = getPrismaClient()

    await prisma.periodontal_examinations.delete({
      where: { id: examId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/periodontal-exams/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
