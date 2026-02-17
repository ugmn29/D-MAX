import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export const dynamic = 'force-dynamic'

/**
 * 口腔機能発達不全症の自動評価API
 * 患者の最新の習慣チェック表回答からC分類を自動判定
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const prisma = getPrismaClient()

    // 1. 習慣チェック表のquestionnaire_idを特定
    const habitQuestionnaire = await prisma.questionnaires.findFirst({
      where: { name: '習慣チェック表' },
      select: { id: true },
    })

    if (!habitQuestionnaire) {
      return NextResponse.json(
        { error: '習慣チェック表の回答が見つかりません' },
        { status: 404 }
      )
    }

    // 1. 最新の習慣チェック表の回答を取得
    const latestResponse = await prisma.questionnaire_responses.findFirst({
      where: {
        patient_id: patientId,
        questionnaire_id: habitQuestionnaire.id,
      },
      orderBy: { completed_at: 'desc' },
      include: {
        questionnaires: {
          select: { name: true },
        },
      },
    })

    if (!latestResponse) {
      return NextResponse.json(
        { error: '習慣チェック表の回答が見つかりません' },
        { status: 404 }
      )
    }

    // 2. 習慣チェック表の質問定義を取得
    const questions = await prisma.questionnaire_questions.findMany({
      where: { questionnaire_id: latestResponse.questionnaire_id },
      select: { id: true, section_name: true, question_text: true },
    })

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: '質問定義の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 3. C分類マッピング情報を取得
    const mappings = await prisma.c_classification_question_mapping.findMany({
      orderBy: [
        { c_classification_item: 'asc' },
        { priority: 'desc' },
      ],
    })

    if (!mappings || mappings.length === 0) {
      return NextResponse.json(
        { error: 'マッピング情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 4. 回答データから各C分類項目を評価
    const responseData = latestResponse.response_data as Record<string, any>
    const evaluation = evaluateCClassification(responseData, mappings, questions)

    // 5. 評価結果を保存
    const assessmentData = {
      patient_id: patientId,
      assessment_date: new Date(),
      assessment_type: '離乳完了後',
      questionnaire_response_id: latestResponse.id,
      ...evaluation.results,
    }

    const assessment = await prisma.oral_function_assessments.create({
      data: assessmentData,
    })

    const assessmentConverted = convertDatesToStrings(assessment, ['assessment_date', 'confirmed_at', 'created_at', 'updated_at'])

    return NextResponse.json({
      success: true,
      assessment: assessmentConverted,
      evaluation_details: evaluation.details,
      questionnaire_date: latestResponse.completed_at instanceof Date
        ? latestResponse.completed_at.toISOString()
        : latestResponse.completed_at,
    })
  } catch (error) {
    console.error('口腔機能発達不全症評価エラー:', error)
    return NextResponse.json(
      { error: '評価処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * 既存の評価結果を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const prisma = getPrismaClient()

    const assessments = await prisma.oral_function_assessments.findMany({
      where: { patient_id: patientId },
      include: {
        questionnaire_responses: {
          select: { completed_at: true },
        },
        staff: {
          select: { name: true },
        },
      },
      orderBy: { assessment_date: 'desc' },
    })

    const assessmentsConverted = assessments.map(a => {
      const converted = convertDatesToStrings(a, ['assessment_date', 'confirmed_at', 'created_at', 'updated_at'])
      return {
        ...converted,
        questionnaire_responses: a.questionnaire_responses ? {
          completed_at: a.questionnaire_responses.completed_at instanceof Date
            ? a.questionnaire_responses.completed_at.toISOString()
            : a.questionnaire_responses.completed_at,
        } : null,
        staff: a.staff ? { name: a.staff.name } : null,
      }
    })

    return NextResponse.json({ assessments: assessmentsConverted })
  } catch (error) {
    console.error('評価結果取得エラー:', error)
    return NextResponse.json(
      { error: '評価結果の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * 評価結果を更新（スタッフが手動で修正）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const prisma = getPrismaClient()
    const body = await request.json()
    const { assessment_id, updates, staff_id } = body

    const updateData = {
      ...updates,
      evaluated_by_staff_id: staff_id,
      confirmed_at: new Date(),
    }

    const assessment = await prisma.oral_function_assessments.update({
      where: {
        id: assessment_id,
      },
      data: updateData,
    })

    // Verify the assessment belongs to this patient
    if (assessment.patient_id !== patientId) {
      return NextResponse.json(
        { error: '評価結果の更新に失敗しました' },
        { status: 403 }
      )
    }

    const assessmentConverted = convertDatesToStrings(assessment, ['assessment_date', 'confirmed_at', 'created_at', 'updated_at'])

    return NextResponse.json({ success: true, assessment: assessmentConverted })
  } catch (error) {
    console.error('評価結果更新エラー:', error)
    return NextResponse.json(
      { error: '評価結果の更新中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * C分類評価ロジック
 */
function evaluateCClassification(
  responseData: Record<string, any>,
  mappings: any[],
  questions: any[]
) {
  const results: Record<string, any> = {}
  const details: Record<string, any> = {}

  // 質問のマップを作成（section_name + question_text -> question_id）
  const questionMap = new Map<string, string>()
  questions.forEach((q) => {
    const key = `${q.section_name}::${q.question_text}`
    questionMap.set(key, q.id)
  })

  // C分類項目ごとにグループ化
  const groupedMappings = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.c_classification_item]) {
      acc[mapping.c_classification_item] = []
    }
    acc[mapping.c_classification_item].push(mapping)
    return acc
  }, {} as Record<string, any[]>)

  // 各C分類項目を評価
  for (const [cItem, itemMappings] of Object.entries(groupedMappings)) {
    const cNumber = parseInt(cItem.replace('C-', ''))
    const resultKey = `c${cNumber}_result`
    const sourceKey = `c${cNumber}_source`
    const notesKey = `c${cNumber}_notes`

    let hasMatch = false
    const matchedQuestions: string[] = []

    for (const mapping of itemMappings as any[]) {
      // 質問IDを検索
      const key = `${mapping.section_name}::${mapping.question_text}`
      const questionId = questionMap.get(key)

      if (questionId) {
        // 回答データから該当する回答を取得
        const questionAnswer = responseData[questionId]

        if (questionAnswer !== null && questionAnswer !== undefined) {
          const condition = mapping.matching_condition
          const isMatch = evaluateCondition(questionAnswer, condition)

          if (isMatch) {
            hasMatch = true
            matchedQuestions.push(
              `${mapping.section_name}「${mapping.question_text}」`
            )
          }
        }
      }
    }

    results[resultKey] = hasMatch
    results[sourceKey] = hasMatch ? 'questionnaire' : null
    results[notesKey] = hasMatch
      ? `自動判定: ${matchedQuestions.join(', ')}`
      : null

    details[cItem] = {
      result: hasMatch,
      matched_questions: matchedQuestions,
      source: hasMatch ? 'questionnaire' : null,
    }
  }

  // スタッフ評価が必要な項目（自動判定不可）
  const staffOnlyItems = ['C-1', 'C-2', 'C-3', 'C-7', 'C-9', 'C-12', 'C-13']
  for (const item of staffOnlyItems) {
    const cNumber = parseInt(item.replace('C-', ''))
    results[`c${cNumber}_result`] = null
    results[`c${cNumber}_source`] = null
    results[`c${cNumber}_notes`] = 'スタッフによる臨床評価が必要'
    details[item] = {
      result: null,
      source: 'requires_staff_evaluation',
      message: 'スタッフによる臨床評価が必要',
    }
  }

  return { results, details }
}

/**
 * 条件評価
 */
function evaluateCondition(answer: any, condition: any): boolean {
  const operator = condition.operator
  const expectedValue = condition.value

  switch (operator) {
    case 'contains':
      // チェックボックスの配列に特定の値が含まれるか
      if (Array.isArray(answer)) {
        return answer.includes(expectedValue)
      }
      return answer === expectedValue

    case 'has_any_value':
      // 何らかの値が選択されているか
      if (Array.isArray(answer)) {
        return answer.length > 0
      }
      return answer !== null && answer !== undefined && answer !== ''

    case 'is_not_empty':
      // テキスト入力が空でないか
      return answer !== null && answer !== undefined && answer !== ''

    default:
      return false
  }
}
