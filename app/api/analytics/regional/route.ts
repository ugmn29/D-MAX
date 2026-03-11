import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

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

    const prisma = getPrismaClient()

    // 地域別患者数と売上を集計
    // 1. ジオコーディングキャッシュから地域情報を取得
    const geocodeData = await prisma.patient_geocode_cache.findMany({
      where: {
        clinic_id: clinicId,
        geocode_status: 'success',
      },
      select: {
        patient_id: true,
        prefecture: true,
        city: true,
        district: true,
        latitude: true,
        longitude: true,
        distance_from_clinic: true,
      },
    })

    // 患者IDリストを取得
    const patientIds = geocodeData?.map(g => g.patient_id) || []

    if (patientIds.length === 0) {
      // ジオコーディングデータがない場合は、患者テーブルから直接集計
      const patients = await prisma.patients.findMany({
        where: { clinic_id: clinicId },
        select: {
          id: true,
          prefecture: true,
          city: true,
          created_at: true,
        },
      })

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
        if (startDate && endDate && patient.created_at) {
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

    // medical_records から売上を取得
    const medicalRecordWhere: Record<string, unknown> = {
      clinic_id: clinicId,
      patient_id: { in: patientIds },
    }
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
      medicalRecordWhere.visit_date = dateFilter
    }

    const medicalRecords = await prisma.medical_records.findMany({
      where: medicalRecordWhere,
      select: {
        patient_id: true,
        patient_copay_amount: true,
        self_pay_amount: true,
      },
    })

    // 患者ごとの売上を集計
    const patientRevenueMap = new Map<string, number>()
    for (const record of medicalRecords || []) {
      const copay = record.patient_copay_amount ? Number(record.patient_copay_amount) : 0
      const selfPay = record.self_pay_amount ? Number(record.self_pay_amount) : 0
      const current = patientRevenueMap.get(record.patient_id) || 0
      patientRevenueMap.set(record.patient_id, current + copay + selfPay)
    }

    // appointments から予約メニュー名を取得（診療項目フィルター用）
    const appointmentWhere: Record<string, unknown> = {
      clinic_id: clinicId,
      patient_id: { in: patientIds },
      menu1_id: { not: null },
    }
    if (startDate || endDate) {
      const timeFilter: Record<string, unknown> = {}
      if (startDate) timeFilter.gte = new Date(startDate)
      if (endDate) timeFilter.lte = new Date(endDate)
      appointmentWhere.start_time = timeFilter
    }

    const appointmentsWithMenus = await prisma.appointments.findMany({
      where: appointmentWhere,
      select: {
        patient_id: true,
        treatment_menus_appointments_menu1_idTotreatment_menus: { select: { name: true } },
        treatment_menus_appointments_menu2_idTotreatment_menus: { select: { name: true } },
        treatment_menus_appointments_menu3_idTotreatment_menus: { select: { name: true } },
      },
    })

    // 患者ごとの予約メニューを集計
    const patientTreatmentMap = new Map<string, Map<string, number>>()
    for (const appt of appointmentsWithMenus || []) {
      const patientId = appt.patient_id
      if (!patientTreatmentMap.has(patientId)) {
        patientTreatmentMap.set(patientId, new Map())
      }
      const menuCount = patientTreatmentMap.get(patientId)!
      for (const menu of [
        appt.treatment_menus_appointments_menu1_idTotreatment_menus,
        appt.treatment_menus_appointments_menu2_idTotreatment_menus,
        appt.treatment_menus_appointments_menu3_idTotreatment_menus,
      ]) {
        if (menu?.name) {
          menuCount.set(menu.name, (menuCount.get(menu.name) || 0) + 1)
        }
      }
    }

    // 新規患者かどうかを判定するために患者の作成日を取得
    const patientCreatedDates = await prisma.patients.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, created_at: true },
    })

    const patientCreatedMap = new Map<string, Date>()
    for (const p of patientCreatedDates || []) {
      if (p.created_at) {
        patientCreatedMap.set(p.id, new Date(p.created_at))
      }
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
          latitude: geo.latitude ? Number(geo.latitude) : undefined,
          longitude: geo.longitude ? Number(geo.longitude) : undefined,
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
        const distNum = Number(geo.distance_from_clinic)
        area.avgDistance = ((area.avgDistance || 0) * (area.patientCount - 1) + distNum) / area.patientCount
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
