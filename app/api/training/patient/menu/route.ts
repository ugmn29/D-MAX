import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが必要です' },
        { status: 400 }
      )
    }

    // アクティブなトレーニングメニューを取得
    const menuData = await prisma.training_menus.findFirst({
      where: {
        patient_id: patientId,
        is_active: true,
        is_deleted: false,
      },
      select: {
        id: true,
        menu_trainings: {
          select: {
            id: true,
            sort_order: true,
            action_seconds: true,
            rest_seconds: true,
            sets: true,
            trainings: {
              select: {
                id: true,
                training_name: true,
              },
            },
          },
          orderBy: {
            sort_order: 'asc',
          },
        },
      },
    })

    if (!menuData) {
      return NextResponse.json(
        { error: 'メニューが見つかりません' },
        { status: 404 }
      )
    }

    // 今日の完了記録を取得
    const today = new Date().toISOString().split('T')[0]
    const todayStart = new Date(`${today}T00:00:00`)
    const todayEnd = new Date(`${today}T23:59:59`)

    const recordsData = await prisma.training_records.findMany({
      where: {
        patient_id: patientId,
        completed: true,
        performed_at: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        training_id: true,
      },
    })

    const completedIds = new Set(recordsData.map(r => r.training_id))

    // トレーニングリストを作成
    const trainingList = (menuData.menu_trainings || [])
      .map((mt: any, index: number) => ({
        id: mt.trainings.id,
        training_name: mt.trainings.training_name,
        action_seconds: mt.action_seconds,
        rest_seconds: mt.rest_seconds,
        sets: mt.sets,
        sort_order: mt.sort_order,
        completed: completedIds.has(mt.trainings.id),
        locked: index > 0 && !completedIds.has(menuData.menu_trainings[index - 1].trainings.id)
      }))

    return NextResponse.json({
      success: true,
      trainings: trainingList,
      menuId: menuData.id
    })

  } catch (error) {
    console.error('Menu API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
