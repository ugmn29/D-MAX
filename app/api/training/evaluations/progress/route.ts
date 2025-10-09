import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/training/evaluations/progress?patient_id=xxx
// 各トレーニングの評価進捗サマリーを取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const patient_id = searchParams.get('patient_id')

    if (!patient_id) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    // すべての評価を取得
    const { data: evaluations, error: evalError } = await supabase
      .from('training_evaluations')
      .select(`
        *,
        training:trainings(*)
      `)
      .eq('patient_id', patient_id)
      .order('evaluated_at', { ascending: false })

    if (evalError) {
      console.error('評価取得エラー:', evalError)
      return NextResponse.json({ error: evalError.message }, { status: 500 })
    }

    // トレーニングごとに進捗を集計
    const progressMap = new Map()

    evaluations?.forEach((evaluation) => {
      const training_id = evaluation.training_id
      const training = evaluation.training

      if (!progressMap.has(training_id)) {
        progressMap.set(training_id, {
          training_id,
          training_name: training?.training_name || '',
          training_category: training?.category || '',
          latest_evaluation_level: evaluation.evaluation_level,
          latest_evaluated_at: evaluation.evaluated_at,
          evaluation_count: 0,
          level_3_count: 0,
          is_completed: false,
          all_evaluations: [],
        })
      }

      const progress = progressMap.get(training_id)
      progress.evaluation_count++
      progress.all_evaluations.push(evaluation)

      if (evaluation.evaluation_level === 3) {
        progress.level_3_count++
      }

      // 最新の評価がレベル3なら完了とみなす
      if (
        progress.all_evaluations[0].id === evaluation.id &&
        evaluation.evaluation_level === 3
      ) {
        progress.is_completed = true
      }
    })

    // 配列に変換
    const progressArray = Array.from(progressMap.values()).map((p) => {
      const { all_evaluations, ...rest } = p
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
