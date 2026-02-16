import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

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

    const prisma = getPrismaClient()

    // トレンドチャート（日別流入元データ）
    if (chartType === 'trend') {
      // 過去30日のデータを取得
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const acquisitionData = await prisma.patient_acquisition_sources.findMany({
        where: {
          clinic_id: clinicId,
          booking_completed_at: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          final_source: true,
          booking_completed_at: true,
        },
        orderBy: { booking_completed_at: 'asc' },
      })

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
      const acquisitionWhere: Record<string, unknown> = { clinic_id: clinicId }
      if (startDate || endDate) {
        const bookingFilter: Record<string, unknown> = {}
        if (startDate) bookingFilter.gte = new Date(startDate)
        if (endDate) bookingFilter.lte = new Date(endDate)
        acquisitionWhere.booking_completed_at = bookingFilter
      }

      const acquisitionData = await prisma.patient_acquisition_sources.findMany({
        where: acquisitionWhere,
        select: {
          patient_id: true,
          final_source: true,
        },
      })

      // 流入元別集計
      const sourceCountMap = new Map<string, number>()
      for (const item of acquisitionData || []) {
        const source = item.final_source || '不明'
        sourceCountMap.set(source, (sourceCountMap.get(source) || 0) + 1)
      }

      // 広告費データを取得
      const adSpendWhere: Record<string, unknown> = { clinic_id: clinicId }
      if (startDate || endDate) {
        const spendDateFilter: Record<string, unknown> = {}
        if (startDate) spendDateFilter.gte = new Date(startDate)
        if (endDate) spendDateFilter.lte = new Date(endDate)
        adSpendWhere.spend_date = spendDateFilter
      }

      const adSpendData = await prisma.ad_spend_records.findMany({
        where: adSpendWhere,
      })

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
      const adSpendData = await prisma.ad_spend_records.findMany({
        where: {
          clinic_id: clinicId,
          spend_date: {
            gte: new Date(sixMonthsAgo.toISOString().split('T')[0]),
          },
        },
      })

      // 売上データ（appointmentsのstatus=COMPLETEDから取得）
      const revenueData = await prisma.appointments.findMany({
        where: {
          clinic_id: clinicId,
          status: 'COMPLETED',
          start_time: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          start_time: true,
        },
      })

      // 新規患者データ
      const newPatientData = await prisma.patients.findMany({
        where: {
          clinic_id: clinicId,
          created_at: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          id: true,
          created_at: true,
        },
      })

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

      // 売上を集計 (total_feeはスキーマに存在しないため、売上は0として処理)
      // 注: 売上データはsalesテーブルから取得する必要がある場合があります
      for (const appointment of revenueData || []) {
        const date = new Date(appointment.start_time)
        const monthKey = `${date.getFullYear()}/${date.getMonth() + 1}`
        if (monthlyData.has(monthKey)) {
          // total_feeフィールドがないため、売上は別途salesテーブルで管理
          monthlyData.get(monthKey)!.revenue += 0
        }
      }

      // 新規患者を集計
      for (const patient of newPatientData || []) {
        if (!patient.created_at) continue
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
      const funnelWhere: Record<string, unknown> = { clinic_id: clinicId }
      if (startDate || endDate) {
        const timestampFilter: Record<string, unknown> = {}
        if (startDate) timestampFilter.gte = new Date(startDate)
        if (endDate) timestampFilter.lte = new Date(endDate)
        funnelWhere.event_timestamp = timestampFilter
      }

      const funnelEvents = await prisma.web_booking_funnel_events.findMany({
        where: funnelWhere,
      })

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
