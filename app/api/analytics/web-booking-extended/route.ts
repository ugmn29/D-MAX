import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (!clinic_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'clinic_id, start_date, end_date are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // 期間の日数を計算
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // 前期間を計算
    const prevEndDate = new Date(startDate)
    prevEndDate.setDate(prevEndDate.getDate() - 1)
    const prevStartDate = new Date(prevEndDate)
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff + 1)

    const prevStartStr = prevStartDate.toISOString().split('T')[0]
    const prevEndStr = prevEndDate.toISOString().split('T')[0]

    // 当期間のデータ取得
    const { data: currentData, error: currentError } = await supabase
      .from('patient_acquisition_sources')
      .select('*')
      .eq('clinic_id', clinic_id)
      .gte('booking_completed_at', start_date)
      .lte('booking_completed_at', end_date + 'T23:59:59')

    if (currentError) {
      console.error('当期間データ取得エラー:', currentError)
      throw currentError
    }

    // 前期間のデータ取得
    const { data: previousData, error: previousError } = await supabase
      .from('patient_acquisition_sources')
      .select('*')
      .eq('clinic_id', clinic_id)
      .gte('booking_completed_at', prevStartStr)
      .lte('booking_completed_at', prevEndStr + 'T23:59:59')

    if (previousError) {
      console.error('前期間データ取得エラー:', previousError)
      throw previousError
    }

    // 予約データを取得（キャンセル分析用）
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        start_time,
        status,
        treatment_menu_id,
        treatment_menus(id, display_name)
      `)
      .eq('clinic_id', clinic_id)
      .gte('start_time', start_date)
      .lte('start_time', end_date + 'T23:59:59')

    if (appointmentsError) {
      console.error('予約データ取得エラー:', appointmentsError)
    }

    // 患者の来院履歴を取得（リピート分析用）
    const patientIds = currentData?.map(d => d.patient_id).filter(Boolean) || []
    let patientVisitCounts: Record<string, number> = {}

    if (patientIds.length > 0) {
      const { data: visitData } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('clinic_id', clinic_id)
        .in('patient_id', patientIds)
        .in('status', ['completed', 'confirmed'])

      visitData?.forEach(v => {
        patientVisitCounts[v.patient_id] = (patientVisitCounts[v.patient_id] || 0) + 1
      })
    }

    // 1. 媒体別分析（期間比較付き）
    const sourceAnalysis = analyzeBySource(currentData || [], previousData || [])

    // 2. 曜日・時間帯分析
    const timeAnalysis = analyzeByTime(currentData || [])

    // 3. キャンセル分析（媒体別）
    const cancelAnalysis = analyzeCancellations(currentData || [], appointments || [])

    // 4. リピート分析（媒体別）
    const repeatAnalysis = analyzeRepeat(currentData || [], patientVisitCounts)

    // 5. デバイス別分析（期間比較付き）
    const deviceAnalysis = analyzeByDevice(currentData || [], previousData || [])

    return NextResponse.json({
      success: true,
      data: {
        period: {
          current: { start: start_date, end: end_date, days: daysDiff },
          previous: { start: prevStartStr, end: prevEndStr, days: daysDiff },
        },
        summary: {
          current_total: currentData?.length || 0,
          previous_total: previousData?.length || 0,
          change: (currentData?.length || 0) - (previousData?.length || 0),
          change_percentage: previousData?.length
            ? (((currentData?.length || 0) - previousData.length) / previousData.length) * 100
            : 0,
        },
        by_source: sourceAnalysis,
        by_time: timeAnalysis,
        by_cancel: cancelAnalysis,
        by_repeat: repeatAnalysis,
        by_device: deviceAnalysis,
      },
    })
  } catch (error) {
    console.error('Web予約拡張分析APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 媒体別分析（期間比較付き）
function analyzeBySource(currentData: any[], previousData: any[]) {
  const currentStats = new Map<string, number>()
  const previousStats = new Map<string, number>()

  currentData.forEach(d => {
    const source = d.final_source || '不明'
    currentStats.set(source, (currentStats.get(source) || 0) + 1)
  })

  previousData.forEach(d => {
    const source = d.final_source || '不明'
    previousStats.set(source, (previousStats.get(source) || 0) + 1)
  })

  // 全ての媒体を統合
  const allSources = new Set([...currentStats.keys(), ...previousStats.keys()])

  const result = Array.from(allSources).map(source => {
    const current = currentStats.get(source) || 0
    const previous = previousStats.get(source) || 0
    const change = current - previous
    const changePercentage = previous > 0 ? ((change / previous) * 100) : (current > 0 ? 100 : 0)

    return {
      source,
      current_count: current,
      previous_count: previous,
      change,
      change_percentage: changePercentage,
      percentage: currentData.length > 0 ? (current / currentData.length) * 100 : 0,
    }
  })

  return result.sort((a, b) => b.current_count - a.current_count)
}

// 曜日・時間帯分析
function analyzeByTime(data: any[]) {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const hourRanges = [
    { label: '9-12時', start: 9, end: 12 },
    { label: '12-15時', start: 12, end: 15 },
    { label: '15-18時', start: 15, end: 18 },
    { label: '18-21時', start: 18, end: 21 },
    { label: 'その他', start: 0, end: 24 },
  ]

  // 曜日×時間帯のマトリックス
  const matrix: Record<string, Record<string, number>> = {}
  dayNames.forEach(day => {
    matrix[day] = {}
    hourRanges.forEach(range => {
      matrix[day][range.label] = 0
    })
  })

  // 曜日別合計
  const byDay: Record<string, number> = {}
  dayNames.forEach(day => { byDay[day] = 0 })

  // 時間帯別合計
  const byHour: Record<string, number> = {}
  hourRanges.forEach(range => { byHour[range.label] = 0 })

  data.forEach(d => {
    if (!d.booking_completed_at) return
    const date = new Date(d.booking_completed_at)
    const day = dayNames[date.getDay()]
    const hour = date.getHours()

    byDay[day]++

    const range = hourRanges.find(r => hour >= r.start && hour < r.end) || hourRanges[hourRanges.length - 1]
    byHour[range.label]++
    matrix[day][range.label]++
  })

  return {
    by_day: Object.entries(byDay).map(([day, count]) => ({
      day,
      count,
      percentage: data.length > 0 ? (count / data.length) * 100 : 0,
    })),
    by_hour: Object.entries(byHour).map(([hour, count]) => ({
      hour,
      count,
      percentage: data.length > 0 ? (count / data.length) * 100 : 0,
    })),
    matrix,
  }
}

// キャンセル分析（媒体別）
function analyzeCancellations(acquisitionData: any[], appointments: any[]) {
  // patient_idで予約をマッピング
  const appointmentsByPatient = new Map<string, any[]>()
  appointments.forEach(apt => {
    if (!apt.patient_id) return
    if (!appointmentsByPatient.has(apt.patient_id)) {
      appointmentsByPatient.set(apt.patient_id, [])
    }
    appointmentsByPatient.get(apt.patient_id)!.push(apt)
  })

  // 媒体別のキャンセル統計
  const sourceStats = new Map<string, { total: number, cancelled: number, no_show: number }>()

  acquisitionData.forEach(acq => {
    const source = acq.final_source || '不明'
    if (!sourceStats.has(source)) {
      sourceStats.set(source, { total: 0, cancelled: 0, no_show: 0 })
    }

    const stats = sourceStats.get(source)!
    const patientAppointments = appointmentsByPatient.get(acq.patient_id) || []

    patientAppointments.forEach(apt => {
      stats.total++
      if (apt.status === 'cancelled') {
        stats.cancelled++
      } else if (apt.status === 'no_show') {
        stats.no_show++
      }
    })
  })

  const result = Array.from(sourceStats.entries()).map(([source, stats]) => ({
    source,
    total_appointments: stats.total,
    cancelled: stats.cancelled,
    no_show: stats.no_show,
    cancel_rate: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0,
    no_show_rate: stats.total > 0 ? (stats.no_show / stats.total) * 100 : 0,
    total_cancel_rate: stats.total > 0 ? ((stats.cancelled + stats.no_show) / stats.total) * 100 : 0,
  }))

  return result.sort((a, b) => b.total_appointments - a.total_appointments)
}

// リピート分析（媒体別）
function analyzeRepeat(acquisitionData: any[], visitCounts: Record<string, number>) {
  const sourceStats = new Map<string, {
    total: number,
    repeat: number,
    visit_counts: number[]
  }>()

  acquisitionData.forEach(acq => {
    const source = acq.final_source || '不明'
    if (!sourceStats.has(source)) {
      sourceStats.set(source, { total: 0, repeat: 0, visit_counts: [] })
    }

    const stats = sourceStats.get(source)!
    stats.total++

    const visits = visitCounts[acq.patient_id] || 1
    stats.visit_counts.push(visits)

    if (visits > 1) {
      stats.repeat++
    }
  })

  const result = Array.from(sourceStats.entries()).map(([source, stats]) => {
    const avgVisits = stats.visit_counts.length > 0
      ? stats.visit_counts.reduce((a, b) => a + b, 0) / stats.visit_counts.length
      : 0

    return {
      source,
      total_patients: stats.total,
      repeat_patients: stats.repeat,
      repeat_rate: stats.total > 0 ? (stats.repeat / stats.total) * 100 : 0,
      avg_visit_count: avgVisits,
    }
  })

  return result.sort((a, b) => b.total_patients - a.total_patients)
}

// デバイス別分析（期間比較付き）
function analyzeByDevice(currentData: any[], previousData: any[]) {
  const currentStats = new Map<string, number>()
  const previousStats = new Map<string, number>()

  currentData.forEach(d => {
    const device = d.device_type || '不明'
    currentStats.set(device, (currentStats.get(device) || 0) + 1)
  })

  previousData.forEach(d => {
    const device = d.device_type || '不明'
    previousStats.set(device, (previousStats.get(device) || 0) + 1)
  })

  const allDevices = new Set([...currentStats.keys(), ...previousStats.keys()])

  const result = Array.from(allDevices).map(device => {
    const current = currentStats.get(device) || 0
    const previous = previousStats.get(device) || 0
    const change = current - previous
    const changePercentage = previous > 0 ? ((change / previous) * 100) : (current > 0 ? 100 : 0)

    return {
      device,
      current_count: current,
      previous_count: previous,
      change,
      change_percentage: changePercentage,
      percentage: currentData.length > 0 ? (current / currentData.length) * 100 : 0,
    }
  })

  return result.sort((a, b) => b.current_count - a.current_count)
}
