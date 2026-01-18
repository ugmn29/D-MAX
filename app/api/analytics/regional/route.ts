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

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 地域別患者数と売上を集計
    // 1. ジオコーディングキャッシュから地域情報を取得
    const { data: geocodeData, error: geocodeError } = await supabase
      .from('patient_geocode_cache')
      .select(`
        patient_id,
        prefecture,
        city,
        district,
        latitude,
        longitude,
        distance_from_clinic
      `)
      .eq('clinic_id', clinicId)
      .eq('geocode_status', 'success')

    if (geocodeError) {
      return NextResponse.json({ error: geocodeError.message }, { status: 500 })
    }

    // 患者IDリストを取得
    const patientIds = geocodeData?.map(g => g.patient_id) || []

    if (patientIds.length === 0) {
      // ジオコーディングデータがない場合は、患者テーブルから直接集計
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select(`
          id,
          prefecture,
          city,
          created_at
        `)
        .eq('clinic_id', clinicId)

      if (patientsError) {
        return NextResponse.json({ error: patientsError.message }, { status: 500 })
      }

      // 都道府県・市区町村ごとに集計
      const areaMap = new Map<string, {
        prefecture: string
        city: string
        district: string
        patientCount: number
        newPatientCount: number
        totalRevenue: number
        avgRevenue: number
        topTreatments: { name: string; count: number }[]
        latitude?: number
        longitude?: number
      }>()

      for (const patient of patients || []) {
        const key = `${patient.prefecture || '不明'}_${patient.city || '不明'}`

        if (!areaMap.has(key)) {
          areaMap.set(key, {
            prefecture: patient.prefecture || '不明',
            city: patient.city || '不明',
            district: '',
            patientCount: 0,
            newPatientCount: 0,
            totalRevenue: 0,
            avgRevenue: 0,
            topTreatments: [],
          })
        }

        const area = areaMap.get(key)!
        area.patientCount++

        // 期間内の新規患者かどうか
        if (startDate && endDate) {
          const createdAt = new Date(patient.created_at)
          const start = new Date(startDate)
          const end = new Date(endDate)
          if (createdAt >= start && createdAt <= end) {
            area.newPatientCount++
          }
        }
      }

      const areaData = Array.from(areaMap.values())
        .sort((a, b) => b.patientCount - a.patientCount)

      return NextResponse.json({
        data: {
          areas: areaData,
          total_patients: patients?.length || 0,
          total_new_patients: areaData.reduce((sum, a) => sum + a.newPatientCount, 0),
          geocoded_count: 0,
          needs_geocoding: true,
        }
      })
    }

    // 売上データを取得
    let revenueQuery = supabase
      .from('appointments')
      .select(`
        patient_id,
        total_fee
      `)
      .eq('clinic_id', clinicId)
      .in('patient_id', patientIds)
      .eq('status', 'completed')

    if (startDate) {
      revenueQuery = revenueQuery.gte('start_time', startDate)
    }
    if (endDate) {
      revenueQuery = revenueQuery.lte('start_time', endDate)
    }

    const { data: revenueData } = await revenueQuery

    // 患者ごとの売上を集計
    const patientRevenueMap = new Map<string, number>()
    for (const appointment of revenueData || []) {
      const current = patientRevenueMap.get(appointment.patient_id) || 0
      patientRevenueMap.set(appointment.patient_id, current + (appointment.total_fee || 0))
    }

    // 診療メニューデータを取得
    let treatmentQuery = supabase
      .from('appointment_menus')
      .select(`
        appointment:appointments!inner(patient_id, clinic_id, start_time),
        menu:menus(name)
      `)
      .eq('appointment.clinic_id', clinicId)

    if (startDate) {
      treatmentQuery = treatmentQuery.gte('appointment.start_time', startDate)
    }
    if (endDate) {
      treatmentQuery = treatmentQuery.lte('appointment.start_time', endDate)
    }

    const { data: treatmentData } = await treatmentQuery

    // 患者ごとの診療メニューを集計
    const patientTreatmentMap = new Map<string, Map<string, number>>()
    for (const item of treatmentData || []) {
      const patientId = (item.appointment as { patient_id: string })?.patient_id
      const menuName = (item.menu as { name: string })?.name
      if (!patientId || !menuName) continue

      if (!patientTreatmentMap.has(patientId)) {
        patientTreatmentMap.set(patientId, new Map())
      }
      const treatmentCount = patientTreatmentMap.get(patientId)!
      treatmentCount.set(menuName, (treatmentCount.get(menuName) || 0) + 1)
    }

    // 新規患者かどうかを判定するために患者の作成日を取得
    const { data: patientCreatedDates } = await supabase
      .from('patients')
      .select('id, created_at')
      .in('id', patientIds)

    const patientCreatedMap = new Map<string, Date>()
    for (const p of patientCreatedDates || []) {
      patientCreatedMap.set(p.id, new Date(p.created_at))
    }

    // 地域ごとに集計
    const areaMap = new Map<string, {
      prefecture: string
      city: string
      district: string
      patientCount: number
      newPatientCount: number
      totalRevenue: number
      avgRevenue: number
      topTreatments: { name: string; count: number }[]
      latitude?: number
      longitude?: number
      avgDistance?: number
    }>()

    for (const geo of geocodeData || []) {
      const key = `${geo.prefecture || '不明'}_${geo.city || '不明'}_${geo.district || ''}`

      if (!areaMap.has(key)) {
        areaMap.set(key, {
          prefecture: geo.prefecture || '不明',
          city: geo.city || '不明',
          district: geo.district || '',
          patientCount: 0,
          newPatientCount: 0,
          totalRevenue: 0,
          avgRevenue: 0,
          topTreatments: [],
          latitude: geo.latitude,
          longitude: geo.longitude,
          avgDistance: 0,
        })
      }

      const area = areaMap.get(key)!
      area.patientCount++

      // 売上を加算
      const revenue = patientRevenueMap.get(geo.patient_id) || 0
      area.totalRevenue += revenue

      // 新規患者かどうか
      const createdAt = patientCreatedMap.get(geo.patient_id)
      if (createdAt && startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (createdAt >= start && createdAt <= end) {
          area.newPatientCount++
        }
      }

      // 距離の平均を計算
      if (geo.distance_from_clinic) {
        area.avgDistance = ((area.avgDistance || 0) * (area.patientCount - 1) + geo.distance_from_clinic) / area.patientCount
      }
    }

    // 各エリアの診療メニューを集計
    for (const geo of geocodeData || []) {
      const key = `${geo.prefecture || '不明'}_${geo.city || '不明'}_${geo.district || ''}`
      const area = areaMap.get(key)
      if (!area) continue

      const treatments = patientTreatmentMap.get(geo.patient_id)
      if (!treatments) continue

      // 既存の治療リストとマージ
      const treatmentCountMap = new Map<string, number>()
      for (const t of area.topTreatments) {
        treatmentCountMap.set(t.name, t.count)
      }
      for (const [name, count] of treatments) {
        treatmentCountMap.set(name, (treatmentCountMap.get(name) || 0) + count)
      }

      area.topTreatments = Array.from(treatmentCountMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }

    // 平均売上を計算
    for (const area of areaMap.values()) {
      area.avgRevenue = area.patientCount > 0 ? Math.round(area.totalRevenue / area.patientCount) : 0
    }

    const areaData = Array.from(areaMap.values())
      .sort((a, b) => b.patientCount - a.patientCount)

    return NextResponse.json({
      data: {
        areas: areaData,
        total_patients: geocodeData?.length || 0,
        total_new_patients: areaData.reduce((sum, a) => sum + a.newPatientCount, 0),
        total_revenue: areaData.reduce((sum, a) => sum + a.totalRevenue, 0),
        geocoded_count: geocodeData?.length || 0,
        needs_geocoding: false,
      }
    })
  } catch (error) {
    console.error('Regional analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
