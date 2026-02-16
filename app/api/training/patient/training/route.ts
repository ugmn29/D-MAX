import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const trainingId = searchParams.get('trainingId')
    const patientId = searchParams.get('patientId')

    if (!trainingId || !patientId) {
      return NextResponse.json(
        { error: 'トレーニングIDと患者IDが必要です' },
        { status: 400 }
      )
    }

    // トレーニング詳細を取得
    const training = await prisma.trainings.findUnique({
      where: { id: trainingId },
    })

    if (!training) {
      return NextResponse.json(
        { error: 'トレーニングが見つかりません' },
        { status: 404 }
      )
    }

    // 患者のアクティブメニューから設定を取得
    const menuTraining = await prisma.training_menus.findFirst({
      where: {
        patient_id: patientId,
        is_active: true,
        menu_trainings: {
          some: {
            training_id: trainingId,
          },
        },
      },
      select: {
        id: true,
        menu_trainings: {
          where: {
            training_id: trainingId,
          },
          select: {
            action_seconds: true,
            rest_seconds: true,
            sets: true,
          },
        },
      },
    })

    // メニューの設定がある場合はそれを使用、なければデフォルト値
    const config = menuTraining?.menu_trainings?.[0] || {
      action_seconds: training.default_action_seconds,
      rest_seconds: training.default_rest_seconds,
      sets: training.default_sets
    }

    return NextResponse.json({
      success: true,
      training: {
        id: training.id,
        training_name: training.training_name,
        description: training.description,
        category: training.category,
        animation_storage_path: training.animation_storage_path,
        mirror_display: training.mirror_display,
        action_seconds: config.action_seconds,
        rest_seconds: config.rest_seconds,
        sets: config.sets
      },
      menuId: menuTraining?.id || null
    })

  } catch (error) {
    console.error('Training API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
