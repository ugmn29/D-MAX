import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// GET /api/training/menus?patient_id=xxx
// 患者のアクティブメニューを取得（menu_trainings の training_id を含む）
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const activeMenu = await prisma.training_menus.findFirst({
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
            training_id: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: activeMenu })
  } catch (error: any) {
    console.error('メニュー取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/training/menus
// 新しいトレーニングメニューを作成
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await req.json()
    const { patient_id, clinic_id, menu_name, is_active } = body

    if (!patient_id || !clinic_id) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    const menuData = await prisma.training_menus.create({
      data: {
        patient_id,
        clinic_id,
        menu_name: menu_name || 'トレーニングメニュー',
        is_active: is_active !== undefined ? is_active : true,
      },
    })

    const result = convertDatesToStrings(menuData, ['prescribed_at', 'created_at', 'updated_at', 'deleted_at'])

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('メニュー作成エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
