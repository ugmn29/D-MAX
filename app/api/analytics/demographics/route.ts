import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// 年齢を計算
function calculateAge(birthDate: Date | null): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// 年齢を年代に変換
function getAgeGroup(age: number | null): string {
  if (age === null) return '不明'
  if (age < 10) return '0-9歳'
  if (age < 20) return '10-19歳'
  if (age < 30) return '20-29歳'
  if (age < 40) return '30-39歳'
  if (age < 50) return '40-49歳'
  if (age < 60) return '50-59歳'
  if (age < 70) return '60-69歳'
  return '70歳以上'
}

// 年代を簡略化
function getSimpleAgeGroup(age: number | null): string {
  if (age === null) return '不明'
  if (age < 20) return '10代以下'
  if (age < 30) return '20代'
  if (age < 40) return '30代'
  if (age < 50) return '40代'
  return '50代以上'
}

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

    // 患者データを取得
    const patients = await prisma.patients.findMany({
      where: { clinic_id: clinicId },
      select: {
        id: true,
        gender: true,
        birth_date: true,
        created_at: true,
      },
    })

    // 流入元データを取得
    const acquisitionData = await prisma.patient_acquisition_sources.findMany({
      where: { clinic_id: clinicId },
      select: {
        patient_id: true,
        final_source: true,
      },
    })

    const patientSourceMap = new Map<string, string>()
    for (const acq of acquisitionData || []) {
      patientSourceMap.set(acq.patient_id, acq.final_source)
    }

    // 売上データを取得
    // 注: appointmentsテーブルにtotal_feeフィールドは存在しないため、
    // 売上関連のロジックは0値で処理されます
    const revenueWhere: Record<string, unknown> = {
      clinic_id: clinicId,
      status: 'COMPLETED' as const,
    }
    if (startDate || endDate) {
      const timeFilter: Record<string, unknown> = {}
      if (startDate) timeFilter.gte = new Date(startDate)
      if (endDate) timeFilter.lte = new Date(endDate)
      revenueWhere.start_time = timeFilter
    }

    const revenueData = await prisma.appointments.findMany({
      where: revenueWhere,
      select: {
        patient_id: true,
      },
    })

    // 患者ごとの売上を集計（total_feeがないため0として処理）
    const patientRevenueMap = new Map<string, number>()
    for (const appointment of revenueData || []) {
      const current = patientRevenueMap.get(appointment.patient_id) || 0
      patientRevenueMap.set(appointment.patient_id, current + 0)
    }

    // 診療メニューデータを取得
    // appointment_menusテーブルはPrismaスキーマに存在しないため、
    // appointmentsのmenu1_id/menu2_id/menu3_idを使って治療メニューを取得
    const appointmentMenuWhere: Record<string, unknown> = {
      clinic_id: clinicId,
      OR: [
        { menu1_id: { not: null } },
        { menu2_id: { not: null } },
        { menu3_id: { not: null } },
      ],
    }
    if (startDate || endDate) {
      const timeFilter: Record<string, unknown> = {}
      if (startDate) timeFilter.gte = new Date(startDate)
      if (endDate) timeFilter.lte = new Date(endDate)
      appointmentMenuWhere.start_time = timeFilter
    }

    const appointmentsWithMenus = await prisma.appointments.findMany({
      where: appointmentMenuWhere,
      select: {
        patient_id: true,
        treatment_menus_appointments_menu1_idTotreatment_menus: { select: { name: true } },
        treatment_menus_appointments_menu2_idTotreatment_menus: { select: { name: true } },
        treatment_menus_appointments_menu3_idTotreatment_menus: { select: { name: true } },
      },
    })

    // 患者ごとの診療メニューを集計
    const patientTreatmentMap = new Map<string, string[]>()
    for (const item of appointmentsWithMenus || []) {
      const patientId = item.patient_id
      if (!patientTreatmentMap.has(patientId)) {
        patientTreatmentMap.set(patientId, [])
      }
      const treatments = patientTreatmentMap.get(patientId)!
      if (item.treatment_menus_appointments_menu1_idTotreatment_menus?.name) {
        treatments.push(item.treatment_menus_appointments_menu1_idTotreatment_menus.name)
      }
      if (item.treatment_menus_appointments_menu2_idTotreatment_menus?.name) {
        treatments.push(item.treatment_menus_appointments_menu2_idTotreatment_menus.name)
      }
      if (item.treatment_menus_appointments_menu3_idTotreatment_menus?.name) {
        treatments.push(item.treatment_menus_appointments_menu3_idTotreatment_menus.name)
      }
    }

    // 年齢・性別分布を集計
    const ageDistribution: { age: string; male: number; female: number; total: number }[] = []
    const ageGroups = ['0-9歳', '10-19歳', '20-29歳', '30-39歳', '40-49歳', '50-59歳', '60-69歳', '70歳以上']

    const ageGenderMap = new Map<string, { male: number; female: number }>()
    for (const group of ageGroups) {
      ageGenderMap.set(group, { male: 0, female: 0 })
    }

    let totalMale = 0
    let totalFemale = 0

    for (const patient of patients || []) {
      const age = calculateAge(patient.birth_date)
      const ageGroup = getAgeGroup(age)
      const gender = patient.gender

      if (ageGenderMap.has(ageGroup)) {
        const counts = ageGenderMap.get(ageGroup)!
        if (gender === 'male') {
          counts.male++
          totalMale++
        } else if (gender === 'female') {
          counts.female++
          totalFemale++
        }
      }
    }

    for (const group of ageGroups) {
      const counts = ageGenderMap.get(group)!
      ageDistribution.push({
        age: group,
        male: counts.male,
        female: counts.female,
        total: counts.male + counts.female,
      })
    }

    // 性別データ
    const genderData = [
      { name: '男性', value: totalMale, color: '#3B82F6' },
      { name: '女性', value: totalFemale, color: '#EC4899' },
    ]

    // 流入元別年齢構成
    const sourceAgeMap = new Map<string, Map<string, number>>()

    for (const patient of patients || []) {
      const source = patientSourceMap.get(patient.id) || '不明'
      const age = calculateAge(patient.birth_date)
      const simpleAgeGroup = getSimpleAgeGroup(age)

      if (!sourceAgeMap.has(source)) {
        sourceAgeMap.set(source, new Map())
      }
      const ageMap = sourceAgeMap.get(source)!
      ageMap.set(simpleAgeGroup, (ageMap.get(simpleAgeGroup) || 0) + 1)
    }

    const ageBySource: Record<string, string | number>[] = []
    for (const [source, ageMap] of sourceAgeMap) {
      const entry: Record<string, string | number> = { source }
      for (const [ageGroup, count] of ageMap) {
        entry[ageGroup] = count
      }
      ageBySource.push(entry)
    }

    // 年齢層別の売上と人気診療
    const ageRevenueMap = new Map<string, { totalRevenue: number; count: number; treatments: Map<string, number> }>()

    for (const patient of patients || []) {
      const age = calculateAge(patient.birth_date)
      let ageGroup = '不明'
      if (age !== null) {
        if (age < 30) ageGroup = '20代'
        else if (age < 40) ageGroup = '30代'
        else if (age < 50) ageGroup = '40代'
        else if (age < 60) ageGroup = '50代'
        else ageGroup = '60代以上'
      }

      if (!ageRevenueMap.has(ageGroup)) {
        ageRevenueMap.set(ageGroup, { totalRevenue: 0, count: 0, treatments: new Map() })
      }

      const data = ageRevenueMap.get(ageGroup)!
      data.count++
      data.totalRevenue += patientRevenueMap.get(patient.id) || 0

      const treatments = patientTreatmentMap.get(patient.id) || []
      for (const treatment of treatments) {
        data.treatments.set(treatment, (data.treatments.get(treatment) || 0) + 1)
      }
    }

    const revenueByAge: { age: string; avgRevenue: number; topTreatment: string }[] = []
    for (const ageGroup of ['20代', '30代', '40代', '50代', '60代以上']) {
      const data = ageRevenueMap.get(ageGroup)
      if (data && data.count > 0) {
        // 最も多い診療を取得
        let topTreatment = '-'
        let maxCount = 0
        for (const [treatment, count] of data.treatments) {
          if (count > maxCount) {
            maxCount = count
            topTreatment = treatment
          }
        }

        revenueByAge.push({
          age: ageGroup,
          avgRevenue: Math.round(data.totalRevenue / data.count),
          topTreatment,
        })
      }
    }

    return NextResponse.json({
      data: {
        age_distribution: ageDistribution,
        gender_data: genderData,
        age_by_source: ageBySource,
        revenue_by_age: revenueByAge,
        total_patients: patients?.length || 0,
        total_male: totalMale,
        total_female: totalFemale,
      }
    })
  } catch (error) {
    console.error('Demographics analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
