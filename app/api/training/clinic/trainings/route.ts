import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// GET /api/training/clinic/trainings
// トレーニング一覧を取得（is_deleted=false）
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const trainings = await prisma.trainings.findMany({
      where: {
        is_deleted: false,
      },
      orderBy: {
        category: 'asc',
      },
    })

    const result = trainings.map((t) =>
      convertDatesToStrings(t, ['created_at', 'updated_at', 'deleted_at'])
    )

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('トレーニング取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/training/clinic/trainings
// トレーニングを新規作成
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await req.json()

    const training = await prisma.trainings.create({
      data: {
        training_name: body.training_name,
        description: body.description || null,
        category: body.category || null,
        default_action_seconds: body.default_action_seconds || 10,
        default_rest_seconds: body.default_rest_seconds || 5,
        default_sets: body.default_sets || 3,
        instructions: body.instructions || [],
        precautions: body.precautions || [],
        evaluation_level_1_label: body.evaluation_level_1_label || null,
        evaluation_level_1_criteria: body.evaluation_level_1_criteria || null,
        evaluation_level_2_label: body.evaluation_level_2_label || null,
        evaluation_level_2_criteria: body.evaluation_level_2_criteria || null,
        evaluation_level_3_label: body.evaluation_level_3_label || null,
        evaluation_level_3_criteria: body.evaluation_level_3_criteria || null,
        clinic_id: body.clinic_id || null,
        is_default: body.is_default ?? true,
        is_deleted: false,
      },
    })

    return NextResponse.json({ data: training })
  } catch (error: any) {
    console.error('トレーニング作成エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/training/clinic/trainings
// トレーニングを更新
export async function PUT(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await req.json()

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const training = await prisma.trainings.update({
      where: { id: body.id },
      data: {
        training_name: body.training_name,
        description: body.description || null,
        category: body.category || null,
        default_action_seconds: body.default_action_seconds,
        default_rest_seconds: body.default_rest_seconds,
        default_sets: body.default_sets,
        instructions: body.instructions || [],
        precautions: body.precautions || [],
        evaluation_level_1_label: body.evaluation_level_1_label || null,
        evaluation_level_1_criteria: body.evaluation_level_1_criteria || null,
        evaluation_level_2_label: body.evaluation_level_2_label || null,
        evaluation_level_2_criteria: body.evaluation_level_2_criteria || null,
        evaluation_level_3_label: body.evaluation_level_3_label || null,
        evaluation_level_3_criteria: body.evaluation_level_3_criteria || null,
        clinic_id: body.clinic_id || null,
        is_default: body.is_default ?? true,
        is_deleted: false,
      },
    })

    return NextResponse.json({ data: training })
  } catch (error: any) {
    console.error('トレーニング更新エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/training/clinic/trainings?id=xxx
// トレーニングを削除
export async function DELETE(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.trainings.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('トレーニング削除エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
