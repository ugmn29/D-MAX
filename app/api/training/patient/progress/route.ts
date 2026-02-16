import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/patient/progress?patientId=xxx
// 患者のトレーニング完了記録を取得（トレーニング名付き）
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    const records = await prisma.training_records.findMany({
      where: {
        patient_id: patientId,
        completed: true,
      },
      include: {
        trainings: {
          select: {
            training_name: true,
          },
        },
      },
      orderBy: {
        performed_at: 'desc',
      },
    })

    // フラット化して返す
    const result = records.map((record) => ({
      training_id: record.training_id,
      performed_at: record.performed_at?.toISOString() || null,
      training_name: record.trainings?.training_name || '不明',
    }))

    return NextResponse.json({ records: result })
  } catch (error: any) {
    console.error('進捗データ取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
