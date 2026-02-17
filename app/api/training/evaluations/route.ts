import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// POST /api/training/evaluations
// 来院時評価を一括保存し、課題を自動判定
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
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
      evaluations: Array<{
        training_id: string
        menu_training_id: string
        evaluation_level: number
        comment?: string
      }>
      evaluator_id?: string
    } = body

    if (!patient_id || !evaluations || evaluations.length === 0) {
      return NextResponse.json(
        { error: 'patient_id and evaluations are required' },
        { status: 400 }
      )
    }

    // 評価データを一括作成
    const savedEvaluations = []
    for (const ev of evaluations) {
      const created = await prisma.training_evaluations.create({
        data: {
          patient_id,
          clinic_id: clinic_id || undefined,
          menu_id: menu_id || null,
          training_id: ev.training_id,
          menu_training_id: ev.menu_training_id || null,
          evaluation_level: ev.evaluation_level,
          comment: ev.comment || null,
          evaluator_id: evaluator_id || null,
          evaluated_at: new Date(),
        },
        include: {
          trainings: true,
        },
      })
      savedEvaluations.push(created)
    }

    // 課題自動判定
    const issueAnalysis = await analyzeIssues(prisma, savedEvaluations)

    // 日付を文字列に変換
    const serializedEvaluations = savedEvaluations.map((ev) => ({
      ...ev,
      evaluated_at: ev.evaluated_at?.toISOString() || null,
      created_at: ev.created_at?.toISOString() || null,
      trainings: ev.trainings ? convertDatesToStrings(ev.trainings) : null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        evaluations: serializedEvaluations,
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
async function analyzeIssues(prisma: any, evaluations: any[]) {
  try {
    // 評価レベル1または2のものを抽出
    const lowEvaluations = evaluations.filter(
      (ev) => ev.evaluation_level === 1 || ev.evaluation_level === 2
    )

    if (lowEvaluations.length === 0) {
      return { identified_issues: [] }
    }

    // 評価→課題判定ルールを取得
    const trainingIds = lowEvaluations.map((ev) => ev.training_id)
    const rules = await prisma.evaluation_issue_rules.findMany({
      where: {
        training_id: { in: trainingIds },
        auto_identify: true,
      },
    })

    // 課題を特定
    const identifiedIssueCodes = new Set<string>()
    const issueEvaluationMap = new Map<string, any>()

    for (const evaluation of lowEvaluations) {
      const matchingRules = rules.filter(
        (rule: any) =>
          rule.training_id === evaluation.training_id &&
          rule.evaluation_level === evaluation.evaluation_level
      )

      matchingRules.forEach((rule: any) => {
        identifiedIssueCodes.add(rule.identified_issue_code)
        if (!issueEvaluationMap.has(rule.identified_issue_code)) {
          issueEvaluationMap.set(rule.identified_issue_code, {
            ...evaluation,
            evaluated_at: evaluation.evaluated_at?.toISOString() || null,
            created_at: evaluation.created_at?.toISOString() || null,
            trainings: evaluation.trainings ? convertDatesToStrings(evaluation.trainings) : null,
          })
        }
      })
    }

    if (identifiedIssueCodes.size === 0) {
      return { identified_issues: [] }
    }

    // 課題情報を取得
    const issues = await prisma.patient_issues.findMany({
      where: {
        code: { in: Array.from(identifiedIssueCodes) },
      },
    })

    // 推奨トレーニングを取得
    const mappings = await prisma.issue_training_mappings.findMany({
      where: {
        issue_code: { in: Array.from(identifiedIssueCodes) },
      },
      include: {
        trainings: true,
      },
      orderBy: {
        priority: 'asc',
      },
    })

    // 結果を整形
    const identifiedIssues = issues.map((issue: any) => ({
      issue: convertDatesToStrings(issue),
      triggering_evaluation: issueEvaluationMap.get(issue.code),
      recommended_trainings: mappings
        .filter((m: any) => m.issue_code === issue.code)
        .map((m: any) => ({
          ...m,
          created_at: m.created_at?.toISOString() || null,
          training: m.trainings ? convertDatesToStrings(m.trainings) : null,
        })),
    }))

    return { identified_issues: identifiedIssues }
  } catch (error) {
    console.error('課題分析エラー:', error)
    return { identified_issues: [] }
  }
}

// GET /api/training/evaluations?patient_id=xxx&limit=50
// 患者の評価履歴を取得
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const patient_id = searchParams.get('patient_id')
    const limit = parseInt(searchParams.get('limit') || '50')

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
      take: limit,
    })

    const result = evaluations.map((ev: any) => ({
      ...ev,
      evaluated_at: ev.evaluated_at?.toISOString() || null,
      created_at: ev.created_at?.toISOString() || null,
      training: ev.trainings ? convertDatesToStrings(ev.trainings) : null,
    }))

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('評価履歴取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
