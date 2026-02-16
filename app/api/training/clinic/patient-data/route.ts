import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/clinic/patient-data?patientId=xxx&type=active-menu|menu-history|training-records
// 患者のトレーニング関連データを取得
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')
    const type = searchParams.get('type')

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    if (type === 'active-menu') {
      // アクティブなメニューを取得（menu_trainings + trainings 含む）
      const menuData = await prisma.training_menus.findFirst({
        where: {
          patient_id: patientId,
          is_active: true,
        },
        include: {
          menu_trainings: {
            include: {
              trainings: true,
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
      })

      if (!menuData) {
        return NextResponse.json({ data: null })
      }

      // フォーマットして返す
      const result = {
        ...menuData,
        prescribed_at: menuData.prescribed_at?.toISOString() || null,
        created_at: menuData.created_at?.toISOString() || null,
        updated_at: menuData.updated_at?.toISOString() || null,
        deleted_at: menuData.deleted_at?.toISOString() || null,
        menu_trainings: menuData.menu_trainings.map((mt) => ({
          ...mt,
          created_at: mt.created_at?.toISOString() || null,
          training: mt.trainings ? {
            ...mt.trainings,
            created_at: mt.trainings.created_at?.toISOString() || null,
            updated_at: mt.trainings.updated_at?.toISOString() || null,
            deleted_at: mt.trainings.deleted_at?.toISOString() || null,
          } : null,
          trainings: undefined,
        })),
      }

      return NextResponse.json({ data: result })
    }

    if (type === 'menu-history') {
      // メニュー履歴を取得（非アクティブなメニュー）
      const historyData = await prisma.training_menus.findMany({
        where: {
          patient_id: patientId,
          is_active: false,
        },
        include: {
          menu_trainings: {
            include: {
              trainings: true,
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
        orderBy: {
          prescribed_at: 'desc',
        },
      })

      const result = historyData.map((menu) => ({
        ...menu,
        prescribed_at: menu.prescribed_at?.toISOString() || null,
        created_at: menu.created_at?.toISOString() || null,
        updated_at: menu.updated_at?.toISOString() || null,
        deleted_at: menu.deleted_at?.toISOString() || null,
        menu_trainings: menu.menu_trainings.map((mt) => ({
          ...mt,
          created_at: mt.created_at?.toISOString() || null,
          training: mt.trainings ? {
            ...mt.trainings,
            created_at: mt.trainings.created_at?.toISOString() || null,
            updated_at: mt.trainings.updated_at?.toISOString() || null,
            deleted_at: mt.trainings.deleted_at?.toISOString() || null,
          } : null,
          trainings: undefined,
        })),
      }))

      return NextResponse.json({ data: result })
    }

    if (type === 'training-records') {
      // トレーニング実施記録を取得
      const limit = parseInt(searchParams.get('limit') || '50')

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
        take: limit,
      })

      const result = recordsData.map((record) => ({
        ...record,
        performed_at: record.performed_at?.toISOString() || null,
        created_at: record.created_at?.toISOString() || null,
        training: record.trainings ? {
          ...record.trainings,
          created_at: record.trainings.created_at?.toISOString() || null,
          updated_at: record.trainings.updated_at?.toISOString() || null,
          deleted_at: record.trainings.deleted_at?.toISOString() || null,
        } : null,
        trainings: undefined,
      }))

      return NextResponse.json({ data: result })
    }

    // type=trainings-data: 全トレーニング + 評価データ + 処方データ
    if (type === 'trainings-data') {
      const clinicId = searchParams.get('clinicId')

      // 全トレーニングを取得
      const trainingsData = await prisma.trainings.findMany({
        where: {
          is_deleted: false,
        },
        orderBy: [
          { category: 'asc' },
          { training_name: 'asc' },
        ],
      })

      return NextResponse.json({
        data: trainingsData.map((t) => ({
          ...t,
          created_at: t.created_at?.toISOString() || null,
          updated_at: t.updated_at?.toISOString() || null,
          deleted_at: t.deleted_at?.toISOString() || null,
        })),
      })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error: any) {
    console.error('患者データ取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
