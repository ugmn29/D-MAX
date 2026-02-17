import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// GET /api/training/evaluations/progress?patient_id=xxx
// 各トレーニングの評価進捗サマリーを取得
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

    // すべての評価を取得
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

    // トレーニングごとに進捗を集計
    const progressMap = new Map()

    evaluations.forEach((evaluation: any) => {
      const training_id = evaluation.training_id
      const training = evaluation.trainings

      if (!progressMap.has(training_id)) {
        progressMap.set(training_id, {
          training_id,
          training_name: training?.training_name || '',
          training_category: training?.category || '',
          latest_evaluation_level: evaluation.evaluation_level,
          latest_evaluated_at: evaluation.evaluated_at?.toISOString() || null,
          evaluation_count: 0,
          level_3_count: 0,
          is_completed: false,
          _first_evaluation_id: evaluation.id,
        })
      }

      const progress = progressMap.get(training_id)
      progress.evaluation_count++

      if (evaluation.evaluation_level === 3) {
        progress.level_3_count++
      }

      // 最新の評価がレベル3なら完了とみなす
      if (
        progress._first_evaluation_id === evaluation.id &&
        evaluation.evaluation_level === 3
      ) {
        progress.is_completed = true
      }
    })

    // 配列に変換（内部プロパティを除外）
    const progressArray = Array.from(progressMap.values()).map((p) => {
      const { _first_evaluation_id, ...rest } = p
      return rest
    })

    return NextResponse.json({ success: true, data: progressArray })
  } catch (error: any) {
    console.error('進捗取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
