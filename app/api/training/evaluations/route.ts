import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { EvaluationInput, TrainingEvaluation, IssueAnalysisResult } from '@/types/evaluation'

// POST /api/training/evaluations
// 来院時評価を一括保存し、課題を自動判定
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      patient_id,
      clinic_id,
      menu_id,
      evaluations,
      evaluator_id,
    }: {
      patient_id: string
      clinic_id: string
      menu_id: string | null
      evaluations: EvaluationInput[]
      evaluator_id?: string
    } = body

    if (!patient_id || !clinic_id || !evaluations || evaluations.length === 0) {
      return NextResponse.json(
        { error: 'patient_id, clinic_id, and evaluations are required' },
        { status: 400 }
      )
    }

    // 評価データを準備
    const evaluationRecords = evaluations.map((ev) => ({
      patient_id,
      clinic_id,
      menu_id,
      training_id: ev.training_id,
      menu_training_id: ev.menu_training_id,
      evaluation_level: ev.evaluation_level,
      comment: ev.comment || null,
      evaluator_id: evaluator_id || null,
      evaluated_at: new Date().toISOString(),
    }))

    // 評価を保存
    const { data: savedEvaluations, error: evaluationError } = await supabase
      .from('training_evaluations')
      .insert(evaluationRecords)
      .select(`
        *,
        training:trainings(*)
      `)

    if (evaluationError) {
      console.error('評価保存エラー:', evaluationError)
      return NextResponse.json({ error: evaluationError.message }, { status: 500 })
    }

    // 課題自動判定
    const { data: issueAnalysis, error: analysisError } = await analyzeIssues(
      savedEvaluations as TrainingEvaluation[]
    )

    if (analysisError) {
      console.error('課題分析エラー:', analysisError)
      // 課題分析エラーでも評価は保存されているので、警告として返す
      return NextResponse.json({
        success: true,
        data: {
          evaluations: savedEvaluations,
          identified_issues: [],
        },
        warning: '課題の自動判定に失敗しました',
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        evaluations: savedEvaluations,
        identified_issues: issueAnalysis?.identified_issues || [],
      },
    })
  } catch (error: any) {
    console.error('評価記録エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// 課題自動判定関数
async function analyzeIssues(evaluations: TrainingEvaluation[]) {
  try {
    // 評価レベル1または2のものを抽出
    const lowEvaluations = evaluations.filter(
      (ev) => ev.evaluation_level === 1 || ev.evaluation_level === 2
    )

    if (lowEvaluations.length === 0) {
      return { data: { identified_issues: [] }, error: null }
    }

    // 評価→課題判定ルールを取得
    const trainingIds = lowEvaluations.map((ev) => ev.training_id)
    const { data: rules, error: rulesError } = await supabase
      .from('evaluation_issue_rules')
      .select('*')
      .in('training_id', trainingIds)
      .eq('auto_identify', true)

    if (rulesError) {
      return { data: null, error: rulesError }
    }

    // 課題を特定
    const identifiedIssueCodes = new Set<string>()
    const issueEvaluationMap = new Map<string, TrainingEvaluation>()

    for (const evaluation of lowEvaluations) {
      const matchingRules = rules?.filter(
        (rule) =>
          rule.training_id === evaluation.training_id &&
          rule.evaluation_level === evaluation.evaluation_level
      )

      matchingRules?.forEach((rule) => {
        identifiedIssueCodes.add(rule.identified_issue_code)
        if (!issueEvaluationMap.has(rule.identified_issue_code)) {
          issueEvaluationMap.set(rule.identified_issue_code, evaluation)
        }
      })
    }

    if (identifiedIssueCodes.size === 0) {
      return { data: { identified_issues: [] }, error: null }
    }

    // 課題情報と推奨トレーニングを取得
    const { data: issues, error: issuesError } = await supabase
      .from('patient_issues')
      .select('*')
      .in('code', Array.from(identifiedIssueCodes))

    if (issuesError) {
      return { data: null, error: issuesError }
    }

    // 推奨トレーニングを取得
    const { data: mappings, error: mappingsError } = await supabase
      .from('issue_training_mappings')
      .select(`
        *,
        training:trainings(*)
      `)
      .in('issue_code', Array.from(identifiedIssueCodes))
      .order('priority', { ascending: true })

    if (mappingsError) {
      return { data: null, error: mappingsError }
    }

    // 結果を整形
    const identifiedIssues = issues?.map((issue) => ({
      issue,
      triggering_evaluation: issueEvaluationMap.get(issue.code)!,
      recommended_trainings:
        mappings?.filter((m) => m.issue_code === issue.code) || [],
    }))

    return { data: { identified_issues: identifiedIssues || [] }, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// GET /api/training/evaluations?patient_id=xxx&limit=50
// 患者の評価履歴を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const patient_id = searchParams.get('patient_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!patient_id) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('training_evaluations')
      .select(`
        *,
        training:trainings(*)
      `)
      .eq('patient_id', patient_id)
      .order('evaluated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('評価履歴取得エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('評価履歴取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
