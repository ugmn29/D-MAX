import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

interface PatientLTVData {
  patient_id: string
  acquisition_source: string
  total_revenue: number
  visit_count: number
  first_visit_date: string
  last_visit_date: string
  avg_revenue_per_visit: number
  patient_lifetime_days: number
}

interface SourceLTVData {
  source: string
  patient_count: number
  total_revenue: number
  avg_ltv: number
  avg_visit_count: number
  avg_revenue_per_visit: number
  min_ltv: number
  max_ltv: number
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
        booking_completed_at: true,
      },
    })

    if (!acquisitionData || acquisitionData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          patient_ltv: [],
          source_ltv: [],
          total_patients: 0,
          total_revenue: 0,
          avg_ltv: 0
        }
      })
    }

    // 患者IDリストを取得
    const patientIds = acquisitionData.map(a => a.patient_id)

    // 各患者の予約データを取得
    const appointments = await prisma.appointments.findMany({
      where: {
        clinic_id,
        patient_id: { in: patientIds },
        status: { not: 'CANCELLED' },
      },
      select: {
        patient_id: true,
        appointment_date: true,
        status: true,
      },
    })

    // 各患者の会計データを取得（salesテーブルを使用）
    const salesData = await prisma.sales.findMany({
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

    // 患者ごとのLTVを計算
    const patientLTVMap = new Map<string, PatientLTVData>()

    acquisitionData.forEach(acquisition => {
      const patientId = acquisition.patient_id
      const source = acquisition.final_source

      // 患者の予約を取得
      const patientAppointments = appointments?.filter(a => a.patient_id === patientId) || []
      const visitCount = patientAppointments.length

      // 患者の会計を取得
      const patientSales = salesData?.filter(p => p.patient_id === patientId) || []
      const totalRevenue = patientSales.reduce((sum, p) => sum + (p.amount || 0), 0)

      // 初回・最終来院日
      const appointmentDates = patientAppointments
        .map(a => new Date(a.appointment_date))
        .sort((a, b) => a.getTime() - b.getTime())

      const bookingCompletedAt = acquisition.booking_completed_at?.toISOString() || ''
      const firstVisitDate = appointmentDates[0]?.toISOString() || bookingCompletedAt
      const lastVisitDate = appointmentDates[appointmentDates.length - 1]?.toISOString() || bookingCompletedAt

      // 患者の生涯日数
      const lifetimeDays = appointmentDates.length > 1
        ? Math.floor((appointmentDates[appointmentDates.length - 1].getTime() - appointmentDates[0].getTime()) / (1000 * 60 * 60 * 24))
        : 0

      patientLTVMap.set(patientId, {
        patient_id: patientId,
        acquisition_source: source,
        total_revenue: totalRevenue,
        visit_count: visitCount,
        first_visit_date: firstVisitDate,
        last_visit_date: lastVisitDate,
        avg_revenue_per_visit: visitCount > 0 ? totalRevenue / visitCount : 0,
        patient_lifetime_days: lifetimeDays
      })
    })

    const patientLTVArray = Array.from(patientLTVMap.values())

    // 流入元別にLTVを集計
    const sourceLTVMap = new Map<string, {
      patients: PatientLTVData[]
      total_revenue: number
    }>()

    patientLTVArray.forEach(patient => {
      if (!sourceLTVMap.has(patient.acquisition_source)) {
        sourceLTVMap.set(patient.acquisition_source, {
          patients: [],
          total_revenue: 0
        })
      }
      const sourceData = sourceLTVMap.get(patient.acquisition_source)!
      sourceData.patients.push(patient)
      sourceData.total_revenue += patient.total_revenue
    })

    const sourceLTVArray: SourceLTVData[] = Array.from(sourceLTVMap.entries()).map(([source, data]) => {
      const patientCount = data.patients.length
      const totalRevenue = data.total_revenue
      const avgLTV = patientCount > 0 ? totalRevenue / patientCount : 0
      const avgVisitCount = data.patients.reduce((sum, p) => sum + p.visit_count, 0) / patientCount
      const avgRevenuePerVisit = data.patients.reduce((sum, p) => sum + p.avg_revenue_per_visit, 0) / patientCount
      const ltvValues = data.patients.map(p => p.total_revenue)

      return {
        source,
        patient_count: patientCount,
        total_revenue: totalRevenue,
        avg_ltv: avgLTV,
        avg_visit_count: avgVisitCount,
        avg_revenue_per_visit: avgRevenuePerVisit,
        min_ltv: Math.min(...ltvValues),
        max_ltv: Math.max(...ltvValues)
      }
    })

    // 流入元別LTVを降順でソート
    sourceLTVArray.sort((a, b) => b.avg_ltv - a.avg_ltv)

    // 全体統計
    const totalPatients = patientLTVArray.length
    const totalRevenue = patientLTVArray.reduce((sum, p) => sum + p.total_revenue, 0)
    const avgLTV = totalPatients > 0 ? totalRevenue / totalPatients : 0

    return NextResponse.json({
      success: true,
      data: {
        patient_ltv: patientLTVArray,
        source_ltv: sourceLTVArray,
        total_patients: totalPatients,
        total_revenue: totalRevenue,
        avg_ltv: avgLTV
      }
    })
  } catch (error) {
    console.error('LTV分析APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
