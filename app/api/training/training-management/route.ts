import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/training-management?patientId=xxx&clinicId=yyy
// 統合トレーニング管理用データを取得
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const clinicId = searchParams.get('clinicId')

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    // 全トレーニングを取得
    const trainingsData = await prisma.trainings.findMany({
      where: {
        is_deleted: false,
        clinic_id: null,
      },
      orderBy: [
        { category: 'asc' },
        { training_name: 'asc' },
      ],
    })

    // アクティブなメニューを取得
    const activeMenuData = await prisma.training_menus.findFirst({
      where: {
        patient_id: patientId,
        is_active: true,
      },
      include: {
        menu_trainings: {
          select: {
            id: true,
            training_id: true,
          },
        },
      },
    })

    // 評価進捗を取得
    const progressData = await prisma.training_evaluations.findMany({
      where: {
        patient_id: patientId,
      },
      select: {
        training_id: true,
        evaluation_level: true,
        evaluated_at: true,
      },
      orderBy: {
        evaluated_at: 'desc',
      },
    })

    // 実施記録を取得
    const recordsData = await prisma.training_records.findMany({
      where: {
        patient_id: patientId,
      },
      include: {
        trainings: true,
      },
      orderBy: {
        performed_at: 'desc',
      },
      take: 50,
    })

    // 日付を文字列に変換
    const trainings = trainingsData.map((t) => ({
      ...t,
      created_at: t.created_at?.toISOString() || null,
      updated_at: t.updated_at?.toISOString() || null,
      deleted_at: t.deleted_at?.toISOString() || null,
    }))

    const activeMenu = activeMenuData ? {
      id: activeMenuData.id,
      menu_trainings: activeMenuData.menu_trainings,
    } : null

    const progress = progressData.map((p) => ({
      training_id: p.training_id,
      evaluation_level: p.evaluation_level,
      evaluated_at: p.evaluated_at?.toISOString() || null,
    }))

    const records = recordsData.map((r) => ({
      id: r.id,
      training_id: r.training_id,
      performed_at: r.performed_at?.toISOString() || null,
      completed: r.completed,
      interrupted: r.interrupted,
      time_of_day: r.time_of_day,
      actual_duration_seconds: r.actual_duration_seconds,
      training: r.trainings ? {
        ...r.trainings,
        created_at: r.trainings.created_at?.toISOString() || null,
        updated_at: r.trainings.updated_at?.toISOString() || null,
        deleted_at: r.trainings.deleted_at?.toISOString() || null,
      } : null,
    }))

    return NextResponse.json({
      trainings,
      activeMenu,
      progress,
      records,
    })
  } catch (error: any) {
    console.error('トレーニング管理データ取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/training/training-management
// トレーニングの処方・処方解除
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await req.json()

    const { action, patientId, clinicId, trainingId, menuTrainingId, activeMenuId } = body

    if (action === 'prescribe') {
      let menuId = activeMenuId

      if (!menuId) {
        // 新しいメニューを作成
        const newMenu = await prisma.training_menus.create({
          data: {
            patient_id: patientId,
            clinic_id: clinicId,
            menu_name: 'トレーニングメニュー',
            is_active: true,
          },
        })
        menuId = newMenu.id
      }

      // 現在の処方数を取得
      const existingCount = await prisma.menu_trainings.count({
        where: { menu_id: menuId },
      })

      // トレーニングを追加
      await prisma.menu_trainings.create({
        data: {
          menu_id: menuId,
          training_id: trainingId,
          sort_order: existingCount + 1,
          action_seconds: 10,
          rest_seconds: 5,
          sets: 3,
          auto_progress: true,
        },
      })

      return NextResponse.json({ success: true, menuId })
    }

    if (action === 'unprescribe') {
      if (!menuTrainingId) {
        return NextResponse.json({ error: 'menuTrainingId is required' }, { status: 400 })
      }

      await prisma.menu_trainings.delete({
        where: { id: menuTrainingId },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('トレーニング管理エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
