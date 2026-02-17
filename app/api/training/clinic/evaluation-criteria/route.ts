import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/clinic/evaluation-criteria?clinic_id=xxx
// 医院のカスタム評価基準を取得
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const customizations = await prisma.clinic_training_customizations.findMany({
      where: {
        clinic_id: clinicId,
      },
    })

    const result = customizations.map((c) => ({
      training_id: c.training_id,
      evaluation_level_1_label: c.evaluation_level_1_label || '',
      evaluation_level_1_criteria: c.evaluation_level_1_criteria || '',
      evaluation_level_2_label: c.evaluation_level_2_label || '',
      evaluation_level_2_criteria: c.evaluation_level_2_criteria || '',
      evaluation_level_3_label: c.evaluation_level_3_label || '',
      evaluation_level_3_criteria: c.evaluation_level_3_criteria || '',
    }))

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('評価基準取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/training/clinic/evaluation-criteria
// 評価基準をupsert
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await req.json()

    const { clinic_id, training_id, ...criteria } = body

    if (!clinic_id || !training_id) {
      return NextResponse.json(
        { error: 'clinic_id and training_id are required' },
        { status: 400 }
      )
    }

    const result = await prisma.clinic_training_customizations.upsert({
      where: {
        clinic_id_training_id: {
          clinic_id,
          training_id,
        },
      },
      update: {
        evaluation_level_1_label: criteria.evaluation_level_1_label,
        evaluation_level_1_criteria: criteria.evaluation_level_1_criteria,
        evaluation_level_2_label: criteria.evaluation_level_2_label,
        evaluation_level_2_criteria: criteria.evaluation_level_2_criteria,
        evaluation_level_3_label: criteria.evaluation_level_3_label,
        evaluation_level_3_criteria: criteria.evaluation_level_3_criteria,
      },
      create: {
        clinic_id,
        training_id,
        evaluation_level_1_label: criteria.evaluation_level_1_label,
        evaluation_level_1_criteria: criteria.evaluation_level_1_criteria,
        evaluation_level_2_label: criteria.evaluation_level_2_label,
        evaluation_level_2_criteria: criteria.evaluation_level_2_criteria,
        evaluation_level_3_label: criteria.evaluation_level_3_label,
        evaluation_level_3_criteria: criteria.evaluation_level_3_criteria,
      },
    })

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('評価基準保存エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/training/clinic/evaluation-criteria?clinic_id=xxx&training_id=yyy
// 評価基準をリセット（削除）
export async function DELETE(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const clinicId = searchParams.get('clinic_id')
    const trainingId = searchParams.get('training_id')

    if (!clinicId || !trainingId) {
      return NextResponse.json(
        { error: 'clinic_id and training_id are required' },
        { status: 400 }
      )
    }

    await prisma.clinic_training_customizations.delete({
      where: {
        clinic_id_training_id: {
          clinic_id: clinicId,
          training_id: trainingId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('評価基準リセットエラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
