import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// POST /api/training/menu-trainings
// メニューにトレーニングを追加
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await req.json()
    const { menu_id, training_id, sort_order, action_seconds, rest_seconds, sets, auto_progress } = body

    if (!menu_id || !training_id) {
      return NextResponse.json(
        { error: 'menu_id and training_id are required' },
        { status: 400 }
      )
    }

    const menuTraining = await prisma.menu_trainings.create({
      data: {
        menu_id,
        training_id,
        sort_order: sort_order || 1,
        action_seconds: action_seconds || 10,
        rest_seconds: rest_seconds || 5,
        sets: sets || 3,
        auto_progress: auto_progress !== undefined ? auto_progress : true,
      },
    })

    const result = convertDatesToStrings(menuTraining, ['created_at'])

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('メニュートレーニング追加エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/training/menu-trainings?id=xxx
// メニューからトレーニングを削除
export async function DELETE(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await prisma.menu_trainings.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('メニュートレーニング削除エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
