import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'
import { NextRequest, NextResponse } from 'next/server'

// GET - 特定の視診検査を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrismaClient()

    const exam = await prisma.visual_examinations.findUnique({
      where: { id },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Visual examination not found' }, { status: 404 })
    }

    const toothData = await prisma.visual_tooth_data.findMany({
      where: { examination_id: id },
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
    console.error('Error in GET /api/visual-examinations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 視診検査を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params
    const { examination_date, notes, tooth_data } = body
    const prisma = getPrismaClient()

    // 検査レコードを更新（examination_dateとnotesが渡された場合のみ）
    const updateData: any = {
      updated_at: new Date(),
    }

    if (examination_date !== undefined) {
      updateData.examination_date = new Date(examination_date)
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const exam = await prisma.visual_examinations.update({
      where: { id },
      data: updateData,
    })

    // 歯牙データを更新する場合
    if (tooth_data) {
      // 既存の歯牙データを削除
      await prisma.visual_tooth_data.deleteMany({
        where: { examination_id: id },
      })

      // 新しい歯牙データを挿入
      const toothDataWithExamId = tooth_data.map((tooth: any) => ({
        ...tooth,
        examination_id: id,
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
    }

    // 既存の歯牙データを取得
    const toothData2 = await prisma.visual_tooth_data.findMany({
      where: { examination_id: id },
      orderBy: { tooth_number: 'asc' },
    })

    const examConverted = convertDatesToStrings(exam, ['examination_date', 'created_at', 'updated_at'])
    const toothConverted = toothData2.map(t =>
      convertDatesToStrings(t, ['created_at'])
    )

    return NextResponse.json({
      ...examConverted,
      tooth_data: toothConverted,
    })
  } catch (error) {
    console.error('Error in PUT /api/visual-examinations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 視診検査を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = getPrismaClient()

    // 歯牙データは ON DELETE CASCADE で自動削除される
    await prisma.visual_examinations.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/visual-examinations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
