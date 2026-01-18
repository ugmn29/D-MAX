import { getSupabaseClient } from '@/lib/utils/supabase-client'

export interface VisitSourceData {
  source: string // 来院きっかけ（Google検索、HP等）
  count: number // 件数
  percentage: number // 割合（%）
  previousCount: number // 前期間の件数
  change: number // 増減数
  changePercentage: number // 増減率（%）
  isHistorical: boolean // 過去の選択肢（現在は利用不可）
}

export interface VisitSourceOtherResponse {
  patient_name: string
  completed_at: string
  other_text: string
}

export interface VisitSourceAnalysisResult {
  sources: VisitSourceData[]
  totalResponses: number
  previousTotalResponses: number
  otherResponses: VisitSourceOtherResponse[]
  questionText: string
  questionExists: boolean
}

/**
 * 来院経路分析データを取得
 */
export async function getVisitSourceAnalysis(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<VisitSourceAnalysisResult> {
  const client = getSupabaseClient()

  // 1. 標準問診表から来院経路の質問を取得（linked_fieldで検索）
  const { data: questionnaires, error: qError } = await client
    .from('questionnaires')
    .select(`
      id,
      name,
      questionnaire_questions!inner (
        id,
        question_text,
        options,
        is_hidden,
        linked_field
      )
    `)
    .eq('clinic_id', clinicId)
    .eq('name', '標準問診表')
    .eq('questionnaire_questions.linked_field', 'referral_source')
    .single()

  if (qError || !questionnaires) {
    console.error('質問取得エラー:', qError)
    return {
      sources: [],
      totalResponses: 0,
      previousTotalResponses: 0,
      otherResponses: [],
      questionText: '来院経路（質問が見つかりません）',
      questionExists: false
    }
  }

  const question = (questionnaires as any).questionnaire_questions[0]
  const questionId = question.id
  const currentOptions: string[] = question.options || []
  const isQuestionHidden = question.is_hidden

  // 2. 期間の計算
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  const previousStart = new Date(start)
  previousStart.setDate(previousStart.getDate() - daysDiff)
  const previousEnd = new Date(start)
  previousEnd.setDate(previousEnd.getDate() - 1)

  // 3. 問診表回答データを取得（患者ごとに初回のみ）
  const { data: responses, error: rError } = await client
    .from('questionnaire_responses')
    .select(`
      id,
      patient_id,
      response_data,
      completed_at,
      questionnaire_id
    `)
    .eq('questionnaire_id', questionnaires.id)
    .gte('completed_at', startDate)
    .lte('completed_at', endDate)
    .order('completed_at', { ascending: true })

  if (rError) {
    console.error('回答データ取得エラー:', rError)
  }

  // 4. 前期間の回答データ
  const { data: previousResponses } = await client
    .from('questionnaire_responses')
    .select(`
      id,
      patient_id,
      response_data,
      completed_at
    `)
    .eq('questionnaire_id', questionnaires.id)
    .gte('completed_at', previousStart.toISOString().split('T')[0])
    .lte('completed_at', previousEnd.toISOString().split('T')[0])
    .order('completed_at', { ascending: true })

  // 5. 各患者の初回回答のみを抽出
  const firstResponsesMap = new Map<string, any>()
  responses?.forEach(response => {
    if (!firstResponsesMap.has(response.patient_id)) {
      firstResponsesMap.set(response.patient_id, response)
    }
  })
  const firstResponses = Array.from(firstResponsesMap.values())

  const previousFirstResponsesMap = new Map<string, any>()
  previousResponses?.forEach(response => {
    if (!previousFirstResponsesMap.has(response.patient_id)) {
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
    const responseData = response.response_data
    const answer = responseData[questionId]

    if (Array.isArray(answer)) {
      answer.forEach(source => {
        sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1)
        allHistoricalSources.add(source)

        // 「その他」の自由記述を収集
        if (source === 'その他' && responseData[`${questionId}_other`]) {
          otherResponsesList.push({
            patient_name: response.patient_id, // 実際は患者名を取得する必要がある
            completed_at: response.completed_at,
            other_text: responseData[`${questionId}_other`]
          })
        }
      })
    }
  })

  // 前期間の集計
  previousFirstResponses.forEach(response => {
    const responseData = response.response_data
    const answer = responseData[questionId]

    if (Array.isArray(answer)) {
      answer.forEach(source => {
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

  return {
    sources,
    totalResponses,
    previousTotalResponses,
    otherResponses: limitedOtherResponses,
    questionText: question.question_text,
    questionExists: !isQuestionHidden
  }
}

/**
 * 来院経路分析データをCSVエクスポート用に整形
 */
export function formatVisitSourceDataForCSV(data: VisitSourceAnalysisResult): string {
  // ヘッダー行（集計結果）
  const summaryHeader = '来院きっかけ,件数,割合(%),前期間件数,増減,増減率(%),備考\n'
  const summaryRows = data.sources.map(s =>
    `${s.source},${s.count},${s.percentage.toFixed(1)},${s.previousCount},${s.change},${s.changePercentage.toFixed(1)},${s.isHistorical ? '(過去の選択肢)' : ''}`
  ).join('\n')

  // 個別回答詳細（その他の回答）
  const detailHeader = '\n\n患者ID,回答日,その他の内容\n'
  const detailRows = data.otherResponses.map(r =>
    `${r.patient_name},${r.completed_at},${r.other_text}`
  ).join('\n')

  return summaryHeader + summaryRows + detailHeader + detailRows
}
