// Migrated to Prisma API Routes

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
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({
      clinic_id: clinicId,
      start_date: startDate,
      end_date: endDate
    })

    const response = await fetch(`${baseUrl}/api/visit-source-analysis?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '来院経路分析データの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('来院経路分析データ取得エラー:', error)
    return {
      sources: [],
      totalResponses: 0,
      previousTotalResponses: 0,
      otherResponses: [],
      questionText: '来院経路（取得に失敗しました）',
      questionExists: false
    }
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
