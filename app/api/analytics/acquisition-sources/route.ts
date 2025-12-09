import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

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

    const supabase = getSupabaseClient()

    // 獲得経路データを取得
    let query = supabase
      .from('patient_acquisition_sources')
      .select('*')
      .eq('clinic_id', clinic_id)

    if (start_date) {
      query = query.gte('booking_completed_at', start_date)
    }
    if (end_date) {
      query = query.lte('booking_completed_at', end_date)
    }

    const { data, error } = await query

    if (error) {
      console.error('獲得経路データ取得エラー:', error)
      return NextResponse.json(
        { error: 'Failed to fetch acquisition data' },
        { status: 500 }
      )
    }

    // 流入元別に集計
    const sourceStats = new Map<string, {
      count: number
      utm_count: number
      questionnaire_count: number
      sources: any[]
    }>()

    data?.forEach((record) => {
      const source = record.final_source
      if (!sourceStats.has(source)) {
        sourceStats.set(source, {
          count: 0,
          utm_count: 0,
          questionnaire_count: 0,
          sources: [],
        })
      }

      const stats = sourceStats.get(source)!
      stats.count++
      if (record.tracking_method === 'utm') {
        stats.utm_count++
      } else {
        stats.questionnaire_count++
      }
      stats.sources.push(record)
    })

    // 配列に変換してソート
    const sourceArray = Array.from(sourceStats.entries()).map(([source, stats]) => ({
      source,
      count: stats.count,
      utm_count: stats.utm_count,
      questionnaire_count: stats.questionnaire_count,
      percentage: data ? (stats.count / data.length) * 100 : 0,
    }))

    sourceArray.sort((a, b) => b.count - a.count)

    // デバイス別集計
    const deviceStats = new Map<string, number>()
    data?.forEach((record) => {
      if (record.device_type) {
        deviceStats.set(
          record.device_type,
          (deviceStats.get(record.device_type) || 0) + 1
        )
      }
    })

    const deviceArray = Array.from(deviceStats.entries()).map(([device, count]) => ({
      device,
      count,
      percentage: data ? (count / data.length) * 100 : 0,
    }))

    deviceArray.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: {
        total_count: data?.length || 0,
        by_source: sourceArray,
        by_device: deviceArray,
        raw_data: data,
      },
    })
  } catch (error) {
    console.error('獲得経路分析APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
