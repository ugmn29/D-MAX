import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!clinicId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // タブクリックイベントを直接クエリ
    const rawTabData = await prisma.hp_tab_click_events.findMany({
      where: {
        clinic_id: clinicId,
        click_timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    })

    // タブ別に集計
    const tabMap = new Map<string, any>()

    rawTabData?.forEach((event: any) => {
      const key = event.tab_id
      if (!tabMap.has(key)) {
        tabMap.set(key, {
          tab_id: event.tab_id,
          tab_label: event.tab_label,
          tab_position: event.tab_position,
          total_clicks: 0,
          visited_booking: 0,
          completed_booking: 0,
          visit_rate: 0,
          completion_rate: 0,
        })
      }

      const stats = tabMap.get(key)
      stats.total_clicks++
      if (event.did_visit_booking) stats.visited_booking++
      if (event.did_complete_booking) stats.completed_booking++
    })

    // 割合を計算
    const tabStatsArray = Array.from(tabMap.values()).map(stats => ({
      ...stats,
      visit_rate: stats.total_clicks > 0
        ? (stats.visited_booking / stats.total_clicks) * 100
        : 0,
      completion_rate: stats.total_clicks > 0
        ? (stats.completed_booking / stats.total_clicks) * 100
        : 0,
    }))

    // クリック数でソート
    tabStatsArray.sort((a, b) => b.total_clicks - a.total_clicks)

    // 2. タブ別のUTM分析
    const tabUtmData = await prisma.hp_tab_click_events.findMany({
      where: {
        clinic_id: clinicId,
        click_timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        utm_source: { not: null },
      },
      select: {
        tab_id: true,
        tab_label: true,
        utm_source: true,
        utm_medium: true,
        utm_campaign: true,
        did_complete_booking: true,
      },
    })

    // UTMソース別・タブ別のクロス集計
    const crossAnalysis = new Map<string, any>()

    tabUtmData?.forEach((event: any) => {
      const key = `${event.tab_id}_${event.utm_source || 'direct'}`
      if (!crossAnalysis.has(key)) {
        crossAnalysis.set(key, {
          tab_id: event.tab_id,
          tab_label: event.tab_label,
          utm_source: event.utm_source || 'direct',
          clicks: 0,
          bookings: 0,
          conversion_rate: 0,
        })
      }

      const stat = crossAnalysis.get(key)
      stat.clicks++
      if (event.did_complete_booking) stat.bookings++
    })

    const crossAnalysisArray = Array.from(crossAnalysis.values()).map(stat => ({
      ...stat,
      conversion_rate: stat.clicks > 0 ? (stat.bookings / stat.clicks) * 100 : 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        tab_stats: tabStatsArray,
        total_clicks: rawTabData?.length || 0,
        total_bookings: rawTabData?.filter((e: any) => e.did_complete_booking).length || 0,
        cross_analysis: crossAnalysisArray,
      },
    })
  } catch (error) {
    console.error('タブ分析API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
