import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// GET /api/training/evaluations/history?patient_id=xxx
// タイムライン形式の評価履歴を取得
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const patient_id = searchParams.get('patient_id')

    if (!patient_id) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const evaluations = await prisma.training_evaluations.findMany({
      where: {
        patient_id,
      },
      include: {
        trainings: true,
      },
      orderBy: {
        evaluated_at: 'desc',
      },
    })

    // 日付を変換してシリアライズ
    const serialized = evaluations.map((ev: any) => ({
      ...ev,
      evaluated_at: ev.evaluated_at?.toISOString() || null,
      created_at: ev.created_at?.toISOString() || null,
      training: ev.trainings ? convertDatesToStrings(ev.trainings) : null,
    }))

    // 日付ごとにグループ化
    const timeline: { [date: string]: any[] } = {}

    serialized.forEach((evaluation: any) => {
      const date = evaluation.evaluated_at
        ? new Date(evaluation.evaluated_at).toISOString().split('T')[0]
        : 'unknown'
      if (!timeline[date]) {
        timeline[date] = []
      }
      timeline[date].push(evaluation)
    })

    // タイムライン配列に変換
    const timelineArray = Object.entries(timeline)
      .map(([date, evals]) => ({
        date,
        evaluated_at: evals[0].evaluated_at,
        evaluations: evals,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ success: true, data: timelineArray })
  } catch (error: any) {
    console.error('評価履歴取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
