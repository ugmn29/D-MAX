import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

interface VisitSourceData {
  source: string
  count: number
  percentage: number
  previousCount: number
  change: number
  changePercentage: number
  isHistorical: boolean
}

interface VisitSourceOtherResponse {
  patient_name: string
  completed_at: string
  other_text: string
}

/**
 * GET /api/visit-source-analysis?clinic_id=xxx&start_date=yyyy-mm-dd&end_date=yyyy-mm-dd
 * 来院経路分析データを取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!clinicId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'clinic_id, start_date, and end_date are required' },
        { status: 400 }
      )
    }

    // 1. 標準問診表から来院経路の質問を取得（linked_fieldで検索）
    const questionnaire = await prisma.questionnaires.findFirst({
      where: {
        clinic_id: clinicId,
        name: '標準問診表'
      },
      include: {
        questionnaire_questions: {
          where: {
            linked_field: 'referral_source'
          }
        }
      }
    })

    if (!questionnaire || questionnaire.questionnaire_questions.length === 0) {
      console.error('質問取得エラー: 標準問診表または来院経路の質問が見つかりません')
      return NextResponse.json({
        sources: [],
        totalResponses: 0,
        previousTotalResponses: 0,
        otherResponses: [],
        questionText: '来院経路（質問が見つかりません）',
        questionExists: false
      })
    }

    const question = questionnaire.questionnaire_questions[0]
    const questionId = question.id
    const currentOptions: string[] = (question.options as string[]) || []
    const isQuestionHidden = question.is_hidden

    // 2. 期間の計算
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const previousStart = new Date(start)
    previousStart.setDate(previousStart.getDate() - daysDiff)
    const previousEnd = new Date(start)
    previousEnd.setDate(previousEnd.getDate() - 1)

    // 3. 問診表回答データを取得（現在期間）
    const responses = await prisma.questionnaire_responses.findMany({
      where: {
        questionnaire_id: questionnaire.id,
        completed_at: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: {
        completed_at: 'asc'
      }
    })

    // 4. 前期間の回答データ
    const previousResponses = await prisma.questionnaire_responses.findMany({
      where: {
        questionnaire_id: questionnaire.id,
        completed_at: {
          gte: previousStart,
          lte: previousEnd
        }
      },
      orderBy: {
        completed_at: 'asc'
      }
    })

    // 5. 各患者の初回回答のみを抽出
    const firstResponsesMap = new Map<string, any>()
    responses.forEach(response => {
      if (response.patient_id && !firstResponsesMap.has(response.patient_id)) {
        firstResponsesMap.set(response.patient_id, response)
      }
    })
    const firstResponses = Array.from(firstResponsesMap.values())

    const previousFirstResponsesMap = new Map<string, any>()
    previousResponses.forEach(response => {
      if (response.patient_id && !previousFirstResponsesMap.has(response.patient_id)) {
        previousFirstResponsesMap.set(response.patient_id, response)
      }
    })
    const previousFirstResponses = Array.from(previousFirstResponsesMap.values())

    // 6. 回答を集計
    const sourceCounts = new Map<string, number>()
    const previousSourceCounts = new Map<string, number>()
    const otherResponsesList: VisitSourceOtherResponse[] = []
    const allHistoricalSources = new Set<string>()

    // 現在期間の集計
    firstResponses.forEach(response => {
      const responseData = response.response_data as Record<string, any>
      const answer = responseData[questionId]

      if (Array.isArray(answer)) {
        answer.forEach((source: string) => {
          sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1)
          allHistoricalSources.add(source)

          // 「その他」の自由記述を収集
          if (source === 'その他' && responseData[`${questionId}_other`]) {
            otherResponsesList.push({
              patient_name: response.patient_id, // 実際は患者名を取得する必要がある
              completed_at: response.completed_at ? response.completed_at.toISOString() : '',
              other_text: responseData[`${questionId}_other`]
            })
          }
        })
      }
    })

    // 前期間の集計
    previousFirstResponses.forEach(response => {
      const responseData = response.response_data as Record<string, any>
      const answer = responseData[questionId]

      if (Array.isArray(answer)) {
        answer.forEach((source: string) => {
          previousSourceCounts.set(source, (previousSourceCounts.get(source) || 0) + 1)
          allHistoricalSources.add(source)
        })
      }
    })

    // 7. 全選択肢をマージ（現在の選択肢 + 過去に使用された選択肢）
    const allSources = new Set([...currentOptions, ...Array.from(allHistoricalSources)])

    // 8. 結果を作成
    const totalResponses = firstResponses.length
    const previousTotalResponses = previousFirstResponses.length

    const sources: VisitSourceData[] = Array.from(allSources).map(source => {
      const count = sourceCounts.get(source) || 0
      const previousCount = previousSourceCounts.get(source) || 0
      const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0
      const change = count - previousCount
      const changePercentage = previousCount > 0 ? ((change / previousCount) * 100) : 0
      const isHistorical = !currentOptions.includes(source)

      return {
        source,
        count,
        percentage,
        previousCount,
        change,
        changePercentage,
        isHistorical
      }
    })

    // 件数順でソート
    sources.sort((a, b) => b.count - a.count)

    // 「その他」の回答を上位10件に制限
    const limitedOtherResponses = otherResponsesList.slice(0, 10)

    return NextResponse.json({
      sources,
      totalResponses,
      previousTotalResponses,
      otherResponses: limitedOtherResponses,
      questionText: question.question_text,
      questionExists: !isQuestionHidden
    })
  } catch (error) {
    console.error('来院経路分析データ取得エラー:', error)
    return NextResponse.json(
      { error: '来院経路分析データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
