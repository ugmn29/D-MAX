import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

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

    const supabase = getSupabaseClient()

    // 獲得経路データを取得
    let acquisitionQuery = supabase
      .from('patient_acquisition_sources')
      .select('patient_id, final_source, booking_completed_at')
      .eq('clinic_id', clinic_id)

    if (start_date) {
      acquisitionQuery = acquisitionQuery.gte('booking_completed_at', start_date)
    }
    if (end_date) {
      acquisitionQuery = acquisitionQuery.lte('booking_completed_at', end_date)
    }

    const { data: acquisitionData, error: acquisitionError } = await acquisitionQuery

    if (acquisitionError) {
      console.error('獲得経路データ取得エラー:', acquisitionError)
      return NextResponse.json(
        { error: 'Failed to fetch acquisition data' },
        { status: 500 }
      )
    }

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
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('patient_id, appointment_date, status')
      .eq('clinic_id', clinic_id)
      .in('patient_id', patientIds)
      .neq('status', 'キャンセル')

    if (appointmentsError) {
      console.error('予約データ取得エラー:', appointmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }

    // 各患者の会計データを取得（実際の売上）
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('patient_id, amount, payment_date')
      .eq('clinic_id', clinic_id)
      .in('patient_id', patientIds)

    if (paymentsError) {
      console.error('会計データ取得エラー:', paymentsError)
      // 会計データがない場合は空配列として続行
    }

    // 患者ごとのLTVを計算
    const patientLTVMap = new Map<string, PatientLTVData>()

    acquisitionData.forEach(acquisition => {
      const patientId = acquisition.patient_id
      const source = acquisition.final_source

      // 患者の予約を取得
      const patientAppointments = appointments?.filter(a => a.patient_id === patientId) || []
      const visitCount = patientAppointments.length

      // 患者の会計を取得
      const patientPayments = payments?.filter(p => p.patient_id === patientId) || []
      const totalRevenue = patientPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

      // 初回・最終来院日
      const appointmentDates = patientAppointments
        .map(a => new Date(a.appointment_date))
        .sort((a, b) => a.getTime() - b.getTime())

      const firstVisitDate = appointmentDates[0]?.toISOString() || acquisition.booking_completed_at
      const lastVisitDate = appointmentDates[appointmentDates.length - 1]?.toISOString() || acquisition.booking_completed_at

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
