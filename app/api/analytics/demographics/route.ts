import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 年齢を計算
function calculateAge(birthDate: string | null): number | null {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 患者データを取得
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select(`
        id,
        gender,
        birth_date,
        created_at
      `)
      .eq('clinic_id', clinicId)

    if (patientsError) {
      return NextResponse.json({ error: patientsError.message }, { status: 500 })
    }

    // 流入元データを取得
    const { data: acquisitionData } = await supabase
      .from('patient_acquisition_sources')
      .select(`
        patient_id,
        final_source
      `)
      .eq('clinic_id', clinicId)

    const patientSourceMap = new Map<string, string>()
    for (const acq of acquisitionData || []) {
      patientSourceMap.set(acq.patient_id, acq.final_source)
    }

    // 売上データを取得
    let revenueQuery = supabase
      .from('appointments')
      .select(`
        patient_id,
        total_fee
      `)
      .eq('clinic_id', clinicId)
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
    const patientTreatmentMap = new Map<string, string[]>()
    for (const item of treatmentData || []) {
      const patientId = (item.appointment as { patient_id: string })?.patient_id
      const menuName = (item.menu as { name: string })?.name
      if (!patientId || !menuName) continue

      if (!patientTreatmentMap.has(patientId)) {
        patientTreatmentMap.set(patientId, [])
      }
      patientTreatmentMap.get(patientId)!.push(menuName)
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
        if (gender === 'male' || gender === '男性') {
          counts.male++
          totalMale++
        } else if (gender === 'female' || gender === '女性') {
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
    const simpleAgeGroups = ['20代', '30代', '40代', '50代', '60代以上']

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
