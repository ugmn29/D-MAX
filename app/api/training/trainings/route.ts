import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// GET /api/training/trainings?clinic_id=xxx
// 全トレーニングを取得（デフォルトのみ、またはクリニック固有を含む）
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const clinicId = searchParams.get('clinic_id')

    // デフォルトトレーニング（clinic_id が null）を取得
    // clinicId が指定されている場合はクリニック固有も含める
    const whereClause: any = {
      is_deleted: false,
    }

    if (clinicId) {
      whereClause.OR = [
        { clinic_id: null },
        { clinic_id: clinicId },
      ]
    } else {
      whereClause.clinic_id = null
    }

    const trainings = await prisma.trainings.findMany({
      where: whereClause,
      orderBy: {
        training_name: 'asc',
      },
    })

    // 日付フィールドを文字列に変換
    const result = trainings.map(t =>
      convertDatesToStrings(t, ['created_at', 'updated_at', 'deleted_at'])
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('トレーニング取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
