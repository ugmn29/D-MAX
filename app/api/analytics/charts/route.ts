import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const chartType = searchParams.get('type') || 'trend' // trend, source, roi, funnel

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // トレンドチャート（日別流入元データ）
    if (chartType === 'trend') {
      // 過去30日のデータを取得
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: acquisitionData, error } = await supabase
        .from('patient_acquisition_sources')
        .select(`
          final_source,
          booking_completed_at
        `)
        .eq('clinic_id', clinicId)
        .gte('booking_completed_at', thirtyDaysAgo.toISOString())
        .order('booking_completed_at', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // 日別・流入元別に集計
      const dateSourceMap = new Map<string, Map<string, number>>()
      const allSources = new Set<string>()

      for (const item of acquisitionData || []) {
        if (!item.booking_completed_at) continue
        const date = new Date(item.booking_completed_at).toISOString().split('T')[0]
        const source = item.final_source || '不明'

        allSources.add(source)

        if (!dateSourceMap.has(date)) {
          dateSourceMap.set(date, new Map())
        }
        const sourceMap = dateSourceMap.get(date)!
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
      }

      // 日付を埋める
      const trendData: Record<string, string | number>[] = []
      const currentDate = new Date(thirtyDaysAgo)
      const today = new Date()

      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const displayDate = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`

        const entry: Record<string, string | number> = {
          date: displayDate,
          fullDate: dateStr,
        }

        const sourceMap = dateSourceMap.get(dateStr) || new Map()
        for (const source of allSources) {
          entry[source] = sourceMap.get(source) || 0
        }

        trendData.push(entry)
        currentDate.setDate(currentDate.getDate() + 1)
      }

      return NextResponse.json({
        data: {
          trend: trendData,
          sources: Array.from(allSources),
        }
      })
    }

    // 流入元別データ
    if (chartType === 'source') {
      let query = supabase
        .from('patient_acquisition_sources')
        .select(`
          patient_id,
          final_source
        `)
        .eq('clinic_id', clinicId)

      if (startDate) {
        query = query.gte('booking_completed_at', startDate)
      }
      if (endDate) {
        query = query.lte('booking_completed_at', endDate)
      }

      const { data: acquisitionData, error } = await query

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // 流入元別集計
      const sourceCountMap = new Map<string, number>()
      for (const item of acquisitionData || []) {
        const source = item.final_source || '不明'
        sourceCountMap.set(source, (sourceCountMap.get(source) || 0) + 1)
      }

      // 広告費データを取得
      let adSpendQuery = supabase
        .from('ad_spend_records')
        .select('*')
        .eq('clinic_id', clinicId)

      if (startDate) {
        adSpendQuery = adSpendQuery.gte('spend_date', startDate)
      }
      if (endDate) {
        adSpendQuery = adSpendQuery.lte('spend_date', endDate)
      }

      const { data: adSpendData } = await adSpendQuery

      // 広告費を流入元ごとに集計
      const sourceSpendMap = new Map<string, number>()
      for (const spend of adSpendData || []) {
        // プラットフォームを流入元にマッピング
        let source = spend.ad_platform
        if (source === 'google_ads') source = 'Google広告'
        else if (source === 'meta_ads' || source === 'instagram') source = 'Instagram'
        else if (source === 'line_ads') source = 'LINE'
        else if (source === 'yahoo_ads') source = 'Yahoo!広告'

        sourceSpendMap.set(source, (sourceSpendMap.get(source) || 0) + Number(spend.amount))
      }

      const sourceData = Array.from(sourceCountMap.entries())
        .map(([source, count]) => ({
          name: source,
          value: count,
          cost: sourceSpendMap.get(source) || 0,
          conversions: count,
        }))
        .sort((a, b) => b.value - a.value)

      return NextResponse.json({
        data: {
          sources: sourceData,
        }
      })
    }

    // ROIデータ（月別）
    if (chartType === 'roi') {
      // 過去6ヶ月のデータを取得
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      // 広告費データ
      const { data: adSpendData } = await supabase
        .from('ad_spend_records')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('spend_date', sixMonthsAgo.toISOString().split('T')[0])

      // 売上データ
      const { data: revenueData } = await supabase
        .from('appointments')
        .select('total_fee, start_time')
        .eq('clinic_id', clinicId)
        .eq('status', 'completed')
        .gte('start_time', sixMonthsAgo.toISOString())

      // 新規患者データ
      const { data: newPatientData } = await supabase
        .from('patients')
        .select('id, created_at')
        .eq('clinic_id', clinicId)
        .gte('created_at', sixMonthsAgo.toISOString())

      // 月別に集計
      const monthlyData = new Map<string, { adSpend: number; revenue: number; newPatients: number }>()

      // 過去6ヶ月の月を初期化
      for (let i = 0; i < 6; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}/${date.getMonth() + 1}`
        monthlyData.set(monthKey, { adSpend: 0, revenue: 0, newPatients: 0 })
      }

      // 広告費を集計
      for (const spend of adSpendData || []) {
        const date = new Date(spend.spend_date)
        const monthKey = `${date.getFullYear()}/${date.getMonth() + 1}`
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey)!.adSpend += Number(spend.amount)
        }
      }

      // 売上を集計
      for (const appointment of revenueData || []) {
        const date = new Date(appointment.start_time)
        const monthKey = `${date.getFullYear()}/${date.getMonth() + 1}`
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey)!.revenue += appointment.total_fee || 0
        }
      }

      // 新規患者を集計
      for (const patient of newPatientData || []) {
        const date = new Date(patient.created_at)
        const monthKey = `${date.getFullYear()}/${date.getMonth() + 1}`
        if (monthlyData.has(monthKey)) {
          monthlyData.get(monthKey)!.newPatients++
        }
      }

      // ROIを計算
      const roiData = Array.from(monthlyData.entries())
        .map(([month, data]) => {
          const roi = data.adSpend > 0
            ? ((data.revenue - data.adSpend) / data.adSpend) * 100
            : 0

          return {
            month,
            広告費: data.adSpend,
            売上: data.revenue,
            新規患者数: data.newPatients,
            ROI: Math.round(roi),
          }
        })
        .reverse() // 古い順に並べる

      return NextResponse.json({
        data: {
          roi: roiData,
        }
      })
    }

    // ファネルデータ
    if (chartType === 'funnel') {
      let query = supabase
        .from('web_booking_funnel_events')
        .select('*')
        .eq('clinic_id', clinicId)

      if (startDate) {
        query = query.gte('event_timestamp', startDate)
      }
      if (endDate) {
        query = query.lte('event_timestamp', endDate)
      }

      const { data: funnelEvents, error } = await query

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // セッションごとの最大ステップを取得
      const sessionMaxStep = new Map<string, number>()
      for (const event of funnelEvents || []) {
        const current = sessionMaxStep.get(event.session_id) || 0
        if (event.step_number > current) {
          sessionMaxStep.set(event.session_id, event.step_number)
        }
      }

      // ステップごとのカウント
      const stepLabels = ['サイト訪問', '予約ページ', '日時選択', '情報入力', '予約完了']
      const stepCounts = [0, 0, 0, 0, 0]

      for (const maxStep of sessionMaxStep.values()) {
        for (let i = 0; i < maxStep && i < 5; i++) {
          stepCounts[i]++
        }
      }

      const totalSessions = sessionMaxStep.size || 1

      const funnelData = stepLabels.map((label, index) => ({
        step: label,
        count: stepCounts[index],
        rate: Math.round((stepCounts[index] / totalSessions) * 100),
      }))

      return NextResponse.json({
        data: {
          funnel: funnelData,
          total_sessions: sessionMaxStep.size,
        }
      })
    }

    return NextResponse.json({ error: 'Invalid chart type' }, { status: 400 })
  } catch (error) {
    console.error('Charts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
