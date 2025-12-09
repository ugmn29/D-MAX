import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase-client'

// GET /api/training/evaluations/history?patient_id=xxx
// タイムライン形式の評価履歴を取得
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

    const { data: evaluations, error } = await supabase
      .from('training_evaluations')
      .select(`
        *,
        training:trainings(*)
      `)
      .eq('patient_id', patient_id)
      .order('evaluated_at', { ascending: false })

    if (error) {
      console.error('評価履歴取得エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 日付ごとにグループ化
    const timeline: { [date: string]: any[] } = {}

    evaluations?.forEach((evaluation) => {
      const date = new Date(evaluation.evaluated_at).toISOString().split('T')[0]
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
