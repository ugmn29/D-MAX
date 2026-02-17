import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

interface ROIData {
  source: string
  ad_spend: number
  patient_count: number
  total_revenue: number
  roi: number // (revenue - spend) / spend * 100
  roas: number // revenue / spend
  cpa: number // cost per acquisition (spend / patient_count)
  avg_ltv: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 広告費データを取得
    const adSpendWhere: any = { clinic_id }
    if (start_date) {
      adSpendWhere.spend_date = { ...adSpendWhere.spend_date, gte: new Date(start_date) }
    }
    if (end_date) {
      adSpendWhere.spend_date = { ...adSpendWhere.spend_date, lte: new Date(end_date) }
    }

    const adSpendData = await prisma.ad_spend_records.findMany({
      where: adSpendWhere,
    })

    // 獲得経路データを取得
    const acquisitionWhere: any = { clinic_id }
    if (start_date) {
      acquisitionWhere.booking_completed_at = { ...acquisitionWhere.booking_completed_at, gte: new Date(start_date) }
    }
    if (end_date) {
      acquisitionWhere.booking_completed_at = { ...acquisitionWhere.booking_completed_at, lte: new Date(end_date) }
    }

    const acquisitionData = await prisma.patient_acquisition_sources.findMany({
      where: acquisitionWhere,
      select: {
        patient_id: true,
        final_source: true,
        utm_source: true,
        utm_medium: true,
        booking_completed_at: true,
      },
    })

    // 患者IDリストを取得
    const patientIds = acquisitionData?.map(a => a.patient_id) || []

    // 各患者の会計データを取得（salesテーブルを使用）
    let salesData: any[] = []
    if (patientIds.length > 0) {
      salesData = await prisma.sales.findMany({
        where: {
          clinic_id,
          patient_id: { in: patientIds },
        },
        select: {
          patient_id: true,
          amount: true,
          sale_date: true,
        },
      })
    }

    // プラットフォーム別に広告費を集計
    const adSpendByPlatform = new Map<string, number>()
    adSpendData?.forEach(record => {
      const platform = record.ad_platform
      const currentSpend = adSpendByPlatform.get(platform) || 0
      adSpendByPlatform.set(platform, currentSpend + Number(record.amount))
    })

    // UTM source をプラットフォームにマッピング
    const sourceMapping: Record<string, string> = {
      'instagram': 'meta_ads',
      'facebook': 'meta_ads',
      'google': 'google_ads',
      'google_ads': 'google_ads',
      'yahoo': 'yahoo_ads',
      'tiktok': 'tiktok'
    }

    // 流入元別に患者数と売上を集計
    const sourceStatsMap = new Map<string, {
      patient_count: number
      total_revenue: number
      patient_ids: string[]
    }>()

    acquisitionData?.forEach(acquisition => {
      const source = acquisition.final_source

      if (!sourceStatsMap.has(source)) {
        sourceStatsMap.set(source, {
          patient_count: 0,
          total_revenue: 0,
          patient_ids: []
        })
      }

      const stats = sourceStatsMap.get(source)!
      stats.patient_count++
      stats.patient_ids.push(acquisition.patient_id)

      // 患者の売上を加算
      const patientSales = salesData?.filter(p => p.patient_id === acquisition.patient_id) || []
      const patientRevenue = patientSales.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      stats.total_revenue += patientRevenue
    })

    // ROI計算
    const roiData: ROIData[] = []

    sourceStatsMap.forEach((stats, source) => {
      // UTM sourceからプラットフォームを判定
      const sourceLower = source.toLowerCase()
      let platform = 'organic'

      for (const [key, value] of Object.entries(sourceMapping)) {
        if (sourceLower.includes(key)) {
          platform = value
          break
        }
      }

      const adSpend = adSpendByPlatform.get(platform) || 0
      const totalRevenue = stats.total_revenue
      const patientCount = stats.patient_count

      // ROI/ROAS/CPA計算
      const roi = adSpend > 0 ? ((totalRevenue - adSpend) / adSpend) * 100 : 0
      const roas = adSpend > 0 ? totalRevenue / adSpend : 0
      const cpa = patientCount > 0 ? adSpend / patientCount : 0
      const avgLTV = patientCount > 0 ? totalRevenue / patientCount : 0

      roiData.push({
        source,
        ad_spend: adSpend,
        patient_count: patientCount,
        total_revenue: totalRevenue,
        roi,
        roas,
        cpa,
        avg_ltv: avgLTV
      })
    })

    // ROI降順でソート
    roiData.sort((a, b) => b.roi - a.roi)

    // 全体統計
    const totalAdSpend = Array.from(adSpendByPlatform.values()).reduce((sum, spend) => sum + spend, 0)
    const totalRevenue = roiData.reduce((sum, d) => sum + d.total_revenue, 0)
    const totalPatients = roiData.reduce((sum, d) => sum + d.patient_count, 0)
    const overallROI = totalAdSpend > 0 ? ((totalRevenue - totalAdSpend) / totalAdSpend) * 100 : 0
    const overallROAS = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0
    const overallCPA = totalPatients > 0 ? totalAdSpend / totalPatients : 0

    return NextResponse.json({
      success: true,
      data: {
        roi_by_source: roiData,
        total_ad_spend: totalAdSpend,
        total_revenue: totalRevenue,
        total_patients: totalPatients,
        overall_roi: overallROI,
        overall_roas: overallROAS,
        overall_cpa: overallCPA
      }
    })
  } catch (error) {
    console.error('ROI分析APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
