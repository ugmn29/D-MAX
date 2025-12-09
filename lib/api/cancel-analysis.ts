import { supabase } from '@/lib/utils/supabase-client'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

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
  // モックモードの場合はモックデータを返す
  const { MOCK_MODE } = await import('@/lib/utils/mock-mode')
  if (MOCK_MODE) {
    console.log('モックモード: キャンセル分析データを生成')
    
    // モックのキャンセル分析データを生成
    const mockData: CancelAnalysisData = {
      total_cancelled: 8,
      registered_cancelled: 5,
      temporary_cancelled: 3,
      reasons: [
        {
          reason_id: 'cancel-reason-1',
          reason_name: '無断キャンセル',
          count: 3,
          registered_count: 2,
          temporary_count: 1
        },
        {
          reason_id: 'cancel-reason-2',
          reason_name: '事前連絡',
          count: 2,
          registered_count: 1,
          temporary_count: 1
        },
        {
          reason_id: 'cancel-reason-3',
          reason_name: '当日キャンセル',
          count: 2,
          registered_count: 1,
          temporary_count: 1
        },
        {
          reason_id: 'cancel-reason-4',
          reason_name: '医院都合',
          count: 1,
          registered_count: 1,
          temporary_count: 0
        }
      ],
      daily_stats: [
        {
          date: '2024-01-15',
          total_cancelled: 2,
          registered_cancelled: 1,
          temporary_cancelled: 1
        },
        {
          date: '2024-01-16',
          total_cancelled: 1,
          registered_cancelled: 1,
          temporary_cancelled: 0
        },
        {
          date: '2024-01-17',
          total_cancelled: 3,
          registered_cancelled: 2,
          temporary_cancelled: 1
        },
        {
          date: '2024-01-18',
          total_cancelled: 2,
          registered_cancelled: 1,
          temporary_cancelled: 1
        }
      ]
    }
    
    return mockData
  }

  const client = getSupabaseClient()
  
  // 基本クエリ
  let query = client
    .from('appointments')
    .select(`
      id,
      status,
      appointment_date,
      cancelled_at,
      cancel_reason_id,
      patient:patients!inner(
        id,
        is_registered
      ),
      cancel_reason:cancel_reasons!inner(
        id,
        name
      )
    `)
    .eq('clinic_id', clinicId)
    .eq('status', 'キャンセル')
    .not('cancel_reason_id', 'is', null)

  // 日付フィルタ
  if (startDate) {
    query = query.gte('appointment_date', startDate)
  }
  if (endDate) {
    query = query.lte('appointment_date', endDate)
  }

  const { data: cancelledAppointments, error } = await query

  if (error) {
    console.error('キャンセル分析データ取得エラー:', error)
    throw error
  }

  // データを集計
  const total_cancelled = cancelledAppointments?.length || 0
  const registered_cancelled = cancelledAppointments?.filter(apt => apt.patient?.is_registered).length || 0
  const temporary_cancelled = total_cancelled - registered_cancelled

  // 理由別集計
  const reasonMap = new Map<string, {
    reason_id: string
    reason_name: string
    count: number
    registered_count: number
    temporary_count: number
  }>()

  cancelledAppointments?.forEach(apt => {
    const reasonId = apt.cancel_reason_id
    const reasonName = apt.cancel_reason?.name || '不明'
    const isRegistered = apt.patient?.is_registered || false

    if (!reasonMap.has(reasonId)) {
      reasonMap.set(reasonId, {
        reason_id: reasonId,
        reason_name: reasonName,
        count: 0,
        registered_count: 0,
        temporary_count: 0
      })
    }

    const reason = reasonMap.get(reasonId)!
    reason.count++
    if (isRegistered) {
      reason.registered_count++
    } else {
      reason.temporary_count++
    }
  })

  const reasons = Array.from(reasonMap.values())

  // 日別集計
  const dailyMap = new Map<string, {
    date: string
    total_cancelled: number
    registered_cancelled: number
    temporary_cancelled: number
  }>()

  cancelledAppointments?.forEach(apt => {
    const date = apt.appointment_date
    const isRegistered = apt.patient?.is_registered || false

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        total_cancelled: 0,
        registered_cancelled: 0,
        temporary_cancelled: 0
      })
    }

    const daily = dailyMap.get(date)!
    daily.total_cancelled++
    if (isRegistered) {
      daily.registered_cancelled++
    } else {
      daily.temporary_cancelled++
    }
  })

  const daily_stats = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

  return {
    total_cancelled,
    registered_cancelled,
    temporary_cancelled,
    reasons,
    daily_stats
  }
}
