// Migrated to Prisma API Routes

export interface CancelAnalysisData {
  total_cancelled: number
  registered_cancelled: number
  temporary_cancelled: number
  reasons: {
    reason_id: string
    reason_name: string
    count: number
    registered_count: number
    temporary_count: number
  }[]
  daily_stats: {
    date: string
    total_cancelled: number
    registered_cancelled: number
    temporary_cancelled: number
  }[]
}

// キャンセル分析データを取得
export async function getCancelAnalysis(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<CancelAnalysisData> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({ clinic_id: clinicId })
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    const response = await fetch(`${baseUrl}/api/cancel-analysis?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'キャンセル分析データの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('キャンセル分析データ取得エラー:', error)
    throw error
  }
}
