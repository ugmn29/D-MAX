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

    // 流入元×診療メニューのクロス分析
    // 予約データを取得（メニューと患者の獲得経路を含む）
    const data = await prisma.appointments.findMany({
      where: {
        clinic_id: clinicId,
        created_at: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: 'COMPLETED',
      },
      select: {
        id: true,
        patient_id: true,
        menu1_id: true,
        created_at: true,
        treatment_menus_appointments_menu1_idTotreatment_menus: {
          select: {
            id: true,
            name: true,
          },
        },
        patients: {
          select: {
            id: true,
            patient_acquisition_sources: {
              select: {
                utm_source: true,
                utm_medium: true,
                utm_campaign: true,
                final_source: true,
              },
            },
          },
        },
      },
    })

    // データを集計
    const menuBySource = new Map<string, any>()

    data?.forEach((appointment: any) => {
      const source = appointment.patients?.patient_acquisition_sources?.[0]
      const menu = appointment.treatment_menus_appointments_menu1_idTotreatment_menus

      if (!source || !menu) return

      const sourceKey = `${source.utm_source || 'direct'}_${source.utm_medium || 'none'}_${source.utm_campaign || 'none'}`
      const menuKey = menu.name

      const key = `${sourceKey}___${menuKey}`

      if (!menuBySource.has(key)) {
        menuBySource.set(key, {
          utm_source: source.utm_source || 'direct',
          utm_medium: source.utm_medium || 'none',
          utm_campaign: source.utm_campaign || 'none',
          final_source: source.final_source,
          menu_name: menu.name,
          booking_count: 0,
          total_revenue: 0,
        })
      }

      const stat = menuBySource.get(key)
      stat.booking_count++
      // treatment_menus doesn't have base_price in schema
      stat.total_revenue += 0
    })

    // Map -> Array に変換してソート
    const menuBySourceArray = Array.from(menuBySource.values())
      .sort((a, b) => b.booking_count - a.booking_count)

    // 診療メニュー別のサマリー
    const menuSummary = new Map<string, any>()
    data?.forEach((appointment: any) => {
      const menu = appointment.treatment_menus_appointments_menu1_idTotreatment_menus
      if (!menu) return

      if (!menuSummary.has(menu.name)) {
        menuSummary.set(menu.name, {
          menu_name: menu.name,
          total_bookings: 0,
          total_revenue: 0,
          sources: new Set(),
        })
      }

      const summary = menuSummary.get(menu.name)
      summary.total_bookings++
      // treatment_menus doesn't have base_price in schema
      summary.total_revenue += 0

      const source = appointment.patients?.patient_acquisition_sources?.[0]
      if (source?.utm_source) {
        summary.sources.add(source.utm_source)
      }
    })

    const menuSummaryArray = Array.from(menuSummary.values()).map(item => ({
      ...item,
      source_count: item.sources.size,
      sources: undefined, // Set を削除
    })).sort((a, b) => b.total_bookings - a.total_bookings)

    // 流入元別のサマリー
    const sourceSummary = new Map<string, any>()
    data?.forEach((appointment: any) => {
      const source = appointment.patients?.patient_acquisition_sources?.[0]
      if (!source) return

      const sourceKey = `${source.utm_source || 'direct'}_${source.utm_medium || 'none'}`

      if (!sourceSummary.has(sourceKey)) {
        sourceSummary.set(sourceKey, {
          utm_source: source.utm_source || 'direct',
          utm_medium: source.utm_medium || 'none',
          total_bookings: 0,
          total_revenue: 0,
          menus: new Set(),
        })
      }

      const summary = sourceSummary.get(sourceKey)
      summary.total_bookings++
      // treatment_menus doesn't have base_price in schema
      summary.total_revenue += 0

      const menu = appointment.treatment_menus_appointments_menu1_idTotreatment_menus
      if (menu?.name) {
        summary.menus.add(menu.name)
      }
    })

    const sourceSummaryArray = Array.from(sourceSummary.values()).map(item => ({
      ...item,
      menu_count: item.menus.size,
      menus: undefined, // Set を削除
    })).sort((a, b) => b.total_bookings - a.total_bookings)

    return NextResponse.json({
      success: true,
      data: {
        menu_by_source: menuBySourceArray, // 流入元×診療メニューのクロス
        menu_summary: menuSummaryArray, // 診療メニュー別サマリー
        source_summary: sourceSummaryArray, // 流入元別サマリー
        total_bookings: data?.length || 0,
      },
    })
  } catch (error) {
    console.error('診療メニュー分析API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
