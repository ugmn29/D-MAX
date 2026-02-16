// Migrated to Prisma API Routes
import { getAppointments } from '@/lib/api/appointments'
import { getPatients } from '@/lib/api/patients'
import { getStaff } from '@/lib/api/staff'

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

// 分析データの型定義
export interface KPIData {
  total_appointments: number
  total_patients: number
  new_patients: number
  total_sales: number
  insurance_sales: number
  self_pay_sales: number
  cancellation_rate: number
  retention_rate: number
  average_sales_per_patient: number
  sales_change_percentage: number
  patients_change_percentage: number
  appointments_change_percentage: number
}

export interface SalesTrendData {
  date: string
  total_sales: number
  insurance_sales: number
  self_pay_sales: number
  appointment_count: number
}

export interface TreatmentSalesData {
  treatment_name: string
  total_sales: number
  appointment_count: number
  percentage: number
}

export interface StaffProductivityData {
  staff_id: string
  staff_name: string
  position_name: string
  total_sales: number
  appointment_count: number
  sales_per_hour: number
  average_sales_per_appointment: number
  available_slots: number
  booked_slots: number
  fill_rate: number
  treatment_breakdown: {
    menu_id: string
    menu_name: string
    count: number
  }[]
  daily_trends: {
    date: string
    sales: number
    appointment_count: number
  }[]
  time_slot_stats: {
    hour: number
    appointment_count: number
  }[]
  day_of_week_stats: {
    day_of_week: number
    appointment_count: number
  }[]
  is_active: boolean
}

export interface TimeSlotAnalysisData {
  time_slot: string
  appointment_count: number
  total_sales: number
  utilization_rate: number
}

// キャンセル分析の型定義
export interface CancelAnalysisData {
  total_cancelled: number
  registered_cancelled: number
  temporary_cancelled: number
  reasons: {
    reason_id: string
    reason_name: string
    count: number
    registered_count: number
    temporary_count: number
  }[]
  daily_stats: {
    date: string
    total_cancelled: number
    registered_cancelled: number
    temporary_cancelled: number
  }[]
}

export interface TimeSlotCancelData {
  time_slot: string
  cancel_count: number
  cancel_rate: number
}

export interface StaffCancelData {
  staff_id: string
  staff_name: string
  position_name: string
  total_appointments: number
  cancelled_appointments: number
  cancel_rate: number
}

export interface TreatmentCancelData {
  menu_id: string
  menu_name: string
  total_appointments: number
  cancelled_appointments: number
  cancel_rate: number
}

export interface TreatmentMenuStats {
  menu_id: string
  treatment_name: string
  appointment_count: number
  level: number
  parent_id?: string
}

export interface AnalyticsData {
  kpi: KPIData
  sales_trend: SalesTrendData[]
  treatment_sales: TreatmentSalesData[]
  staff_productivity: StaffProductivityData[]
  time_slot_analysis: TimeSlotAnalysisData[]
  treatment_menu_stats: TreatmentMenuStats[]
  aggregated_sales_trend?: AggregatedSalesTrendData[]
  comparison_data?: ComparisonData
}

export interface AggregatedSalesTrendData {
  period: string
  label: string
  total_sales: number
  insurance_sales: number
  self_pay_sales: number
  appointment_count: number
}

export interface ComparisonData {
  current_period: {
    total_sales: number
    total_appointments: number
    total_patients: number
    new_patients: number
  }
  comparison_period: {
    total_sales: number
    total_appointments: number
    total_patients: number
    new_patients: number
  }
  changes: {
    sales_change_percentage: number
    appointments_change_percentage: number
    patients_change_percentage: number
    new_patients_change_percentage: number
  }
  comparison_type: 'previous' | 'same_period_last_year' | 'none'
  comparison_label: string
}

export type PeriodType = 'daily' | 'weekly' | 'monthly'
export type ComparisonType = 'previous' | 'same_period_last_year' | 'none'

// --- API Route fetch helpers ---

async function fetchTreatmentMenus(clinicId: string, activeOnly: boolean = false): Promise<any[]> {
  const params = new URLSearchParams({ clinic_id: clinicId })
  if (activeOnly) params.set('active_only', 'true')

  const response = await fetch(`${baseUrl}/api/analytics/treatment-menus?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || '診療メニューの取得に失敗しました')
  }

  return await response.json()
}

async function fetchCancelReasons(clinicId: string): Promise<any[]> {
  const response = await fetch(`${baseUrl}/api/analytics/cancel-reasons?clinic_id=${clinicId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'キャンセル理由の取得に失敗しました')
  }

  return await response.json()
}

async function fetchClinicSettings(clinicId: string): Promise<{ id: string; time_slot_minutes: number }> {
  const response = await fetch(`${baseUrl}/api/analytics/clinic-settings?clinic_id=${clinicId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'クリニック設定の取得に失敗しました')
  }

  return await response.json()
}

// --- Main analytics functions ---

// 基本分析データを取得
export async function getAnalyticsData(
  clinicId: string,
  startDate: string,
  endDate: string,
  periodType: PeriodType = 'daily',
  comparisonType: ComparisonType = 'previous'
): Promise<AnalyticsData> {
  try {
    // 比較期間を計算
    const { prevStartDate, prevEndDate, comparisonLabel } = calculateComparisonPeriod(
      startDate,
      endDate,
      comparisonType
    )

    // 並列でデータを取得
    const [
      kpiData,
      salesTrendData,
      treatmentSalesData,
      staffProductivityData,
      timeSlotAnalysisData,
      treatmentMenuStats,
      comparisonData
    ] = await Promise.all([
      getKPIData(clinicId, startDate, endDate, prevStartDate, prevEndDate),
      getSalesTrendData(clinicId, startDate, endDate),
      getTreatmentSalesData(clinicId, startDate, endDate),
      getStaffProductivityData(clinicId, startDate, endDate),
      getTimeSlotAnalysisData(clinicId, startDate, endDate),
      getTreatmentMenuStats(clinicId, startDate, endDate),
      comparisonType !== 'none'
        ? getComparisonData(clinicId, startDate, endDate, prevStartDate, prevEndDate, comparisonType, comparisonLabel)
        : Promise.resolve(undefined)
    ])

    // 期間タイプに応じて売上推移を集計
    const aggregatedSalesTrend = aggregateSalesTrendByPeriod(salesTrendData, periodType)

    return {
      kpi: kpiData,
      sales_trend: salesTrendData,
      treatment_sales: treatmentSalesData,
      staff_productivity: staffProductivityData,
      time_slot_analysis: timeSlotAnalysisData,
      treatment_menu_stats: treatmentMenuStats,
      aggregated_sales_trend: aggregatedSalesTrend,
      comparison_data: comparisonData
    }
  } catch (error) {
    console.error('分析データ取得エラー:', error)
    throw error
  }
}

// 比較期間を計算するヘルパー関数
function calculateComparisonPeriod(
  startDate: string,
  endDate: string,
  comparisonType: ComparisonType
): { prevStartDate: string; prevEndDate: string; comparisonLabel: string } {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (comparisonType === 'none') {
    return { prevStartDate: '', prevEndDate: '', comparisonLabel: '' }
  }

  if (comparisonType === 'same_period_last_year') {
    // 前年同期
    const prevStart = new Date(start)
    prevStart.setFullYear(prevStart.getFullYear() - 1)
    const prevEnd = new Date(end)
    prevEnd.setFullYear(prevEnd.getFullYear() - 1)

    return {
      prevStartDate: prevStart.toISOString().split('T')[0],
      prevEndDate: prevEnd.toISOString().split('T')[0],
      comparisonLabel: '前年同期比'
    }
  }

  // 前期間（デフォルト）
  const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - periodDays + 1)

  return {
    prevStartDate: prevStart.toISOString().split('T')[0],
    prevEndDate: prevEnd.toISOString().split('T')[0],
    comparisonLabel: '前期比'
  }
}

// 売上推移を期間タイプで集計するヘルパー関数
function aggregateSalesTrendByPeriod(
  salesTrend: SalesTrendData[],
  periodType: PeriodType
): AggregatedSalesTrendData[] {
  if (periodType === 'daily') {
    // 日別はそのまま返す
    return salesTrend.map(item => ({
      period: item.date,
      label: formatDateLabel(item.date, 'daily'),
      total_sales: item.total_sales,
      insurance_sales: item.insurance_sales,
      self_pay_sales: item.self_pay_sales,
      appointment_count: item.appointment_count
    }))
  }

  const aggregatedMap = new Map<string, AggregatedSalesTrendData>()

  salesTrend.forEach(item => {
    const date = new Date(item.date)
    let periodKey: string
    let label: string

    if (periodType === 'weekly') {
      // 週の開始日（月曜日）を計算
      const dayOfWeek = date.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(date)
      monday.setDate(date.getDate() + mondayOffset)
      periodKey = monday.toISOString().split('T')[0]

      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      label = `${formatDateLabel(periodKey, 'weekly')} 〜 ${formatDateLabel(sunday.toISOString().split('T')[0], 'weekly')}`
    } else {
      // 月別
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      label = `${date.getFullYear()}年${date.getMonth() + 1}月`
    }

    if (!aggregatedMap.has(periodKey)) {
      aggregatedMap.set(periodKey, {
        period: periodKey,
        label,
        total_sales: 0,
        insurance_sales: 0,
        self_pay_sales: 0,
        appointment_count: 0
      })
    }

    const aggregated = aggregatedMap.get(periodKey)!
    aggregated.total_sales += item.total_sales
    aggregated.insurance_sales += item.insurance_sales
    aggregated.self_pay_sales += item.self_pay_sales
    aggregated.appointment_count += item.appointment_count
  })

  // 期間順にソート
  return Array.from(aggregatedMap.values()).sort((a, b) => a.period.localeCompare(b.period))
}

// 日付ラベルをフォーマットするヘルパー関数
function formatDateLabel(dateStr: string, periodType: PeriodType): string {
  const date = new Date(dateStr)

  if (periodType === 'daily' || periodType === 'weekly') {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

// 比較データを取得するヘルパー関数
async function getComparisonData(
  clinicId: string,
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string,
  comparisonType: ComparisonType,
  comparisonLabel: string
): Promise<ComparisonData> {
  // 現在期間のデータ
  const currentAppointments = await getAppointments(clinicId, startDate, endDate)
  const currentPatients = await getPatients(clinicId)

  // 比較期間のデータ
  const comparisonAppointments = await getAppointments(clinicId, prevStartDate, prevEndDate)

  // 現在期間の計算
  const currentCompleted = currentAppointments.filter(apt =>
    ['来院済み', '診療中', '会計', '終了'].includes(apt.status)
  ).length
  const currentPatientIds = new Set(currentAppointments.map(apt => apt.patient_id))
  const currentPeriodStart = new Date(startDate)
  const currentNewPatients = currentPatients.filter(patient => {
    const createdAt = new Date(patient.created_at)
    return createdAt >= currentPeriodStart && currentPatientIds.has(patient.id)
  }).length

  // 比較期間の計算
  const comparisonCompleted = comparisonAppointments.filter(apt =>
    ['来院済み', '診療中', '会計', '終了'].includes(apt.status)
  ).length
  const comparisonPatientIds = new Set(comparisonAppointments.map(apt => apt.patient_id))
  const comparisonPeriodStart = new Date(prevStartDate)
  const comparisonNewPatients = currentPatients.filter(patient => {
    const createdAt = new Date(patient.created_at)
    return createdAt >= comparisonPeriodStart && createdAt < currentPeriodStart && comparisonPatientIds.has(patient.id)
  }).length

  // 売上（仮の計算）
  const currentSales = currentCompleted * 35000
  const comparisonSales = comparisonCompleted * 35000

  // 変化率の計算
  const calcChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    current_period: {
      total_sales: currentSales,
      total_appointments: currentAppointments.length,
      total_patients: currentPatientIds.size,
      new_patients: currentNewPatients
    },
    comparison_period: {
      total_sales: comparisonSales,
      total_appointments: comparisonAppointments.length,
      total_patients: comparisonPatientIds.size,
      new_patients: comparisonNewPatients
    },
    changes: {
      sales_change_percentage: calcChangePercentage(currentSales, comparisonSales),
      appointments_change_percentage: calcChangePercentage(currentAppointments.length, comparisonAppointments.length),
      patients_change_percentage: calcChangePercentage(currentPatientIds.size, comparisonPatientIds.size),
      new_patients_change_percentage: calcChangePercentage(currentNewPatients, comparisonNewPatients)
    },
    comparison_type: comparisonType,
    comparison_label: comparisonLabel
  }
}

// KPIデータを取得
async function getKPIData(
  clinicId: string,
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string
): Promise<KPIData> {
  // 現在期間の予約データを取得
  const currentAppointments = await getAppointments(clinicId, startDate, endDate)

  // 前期間の予約データを取得
  const previousAppointments = await getAppointments(clinicId, prevStartDate, prevEndDate)

  // 患者データを取得
  const allPatients = await getPatients(clinicId)

  // 現在期間の計算
  const totalAppointments = currentAppointments.length
  const completedAppointments = currentAppointments.filter(apt =>
    ['来院済み', '診療中', '会計', '終了'].includes(apt.status)
  ).length
  const cancelledAppointments = currentAppointments.filter(apt =>
    apt.status === 'キャンセル'
  ).length

  // 現在期間の患者数を計算
  const currentPatientIds = new Set(currentAppointments.map(apt => apt.patient_id))
  const totalPatients = currentPatientIds.size

  // 新規患者数を計算（期間内に作成された患者）
  const periodStart = new Date(startDate)
  const newPatients = allPatients.filter(patient => {
    const patientCreatedAt = new Date(patient.created_at)
    return patientCreatedAt >= periodStart && currentPatientIds.has(patient.id)
  }).length

  // 本登録患者数を計算
  const registeredPatients = allPatients.filter(patient =>
    patient.is_registered && currentPatientIds.has(patient.id)
  ).length

  // 前期間の計算
  const prevTotalAppointments = previousAppointments.length
  const prevPatientIds = new Set(previousAppointments.map(apt => apt.patient_id))
  const prevTotalPatients = prevPatientIds.size

  // 売上データは現在モック（実際の売上データがないため）
  const totalSales = completedAppointments * 35000
  const insuranceSales = Math.floor(totalSales * 0.67)
  const selfPaySales = totalSales - insuranceSales
  const prevTotalSales = prevTotalAppointments * 35000

  // 変化率の計算
  const salesChangePercentage = prevTotalSales > 0
    ? ((totalSales - prevTotalSales) / prevTotalSales) * 100
    : 0
  const patientsChangePercentage = prevTotalPatients > 0
    ? ((totalPatients - prevTotalPatients) / prevTotalPatients) * 100
    : 0
  const appointmentsChangePercentage = prevTotalAppointments > 0
    ? ((totalAppointments - prevTotalAppointments) / prevTotalAppointments) * 100
    : 0

  return {
    total_appointments: totalAppointments,
    total_patients: totalPatients,
    new_patients: newPatients,
    total_sales: totalSales,
    insurance_sales: insuranceSales,
    self_pay_sales: selfPaySales,
    cancellation_rate: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
    retention_rate: totalPatients > 0 ? (registeredPatients / totalPatients) * 100 : 0,
    average_sales_per_patient: totalPatients > 0 ? totalSales / totalPatients : 0,
    sales_change_percentage: salesChangePercentage,
    patients_change_percentage: patientsChangePercentage,
    appointments_change_percentage: appointmentsChangePercentage
  }
}

// 売上推移データを取得
async function getSalesTrendData(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<SalesTrendData[]> {
  // 実際の予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)

  // 日付ごとにグループ化
  const dailyData = new Map<string, any[]>()

  appointments.forEach(apt => {
    const dateStr = apt.appointment_date
    if (!dailyData.has(dateStr)) {
      dailyData.set(dateStr, [])
    }
    dailyData.get(dateStr)!.push(apt)
  })

  // 日付範囲を生成
  const data: SalesTrendData[] = []
  const currentDate = new Date(startDate)
  const endDateObj = new Date(endDate)

  while (currentDate <= endDateObj) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayAppointments = dailyData.get(dateStr) || []

    // 完了した予約のみをカウント
    const completedAppointments = dayAppointments.filter(apt =>
      ['来院済み', '診療中', '会計', '終了'].includes(apt.status)
    )

    const appointmentCount = completedAppointments.length
    const totalSales = appointmentCount * 35000
    const insuranceSales = Math.floor(totalSales * 0.67)
    const selfPaySales = totalSales - insuranceSales

    data.push({
      date: dateStr,
      total_sales: totalSales,
      insurance_sales: insuranceSales,
      self_pay_sales: selfPaySales,
      appointment_count: appointmentCount
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return data
}

// 診療内容別売上データを取得
async function getTreatmentSalesData(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<TreatmentSalesData[]> {
  // 診療メニューをAPI Routeから取得
  let menus: any[] = []
  try {
    menus = await fetchTreatmentMenus(clinicId)
  } catch (error) {
    console.error('診療メニュー取得エラー:', error)
    return []
  }

  // 実際の予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)

  // 完了した予約のみを対象
  const completedAppointments = appointments.filter(apt =>
    ['来院済み', '診療中', '会計', '終了'].includes(apt.status)
  )

  // 診療メニュー別に集計
  const menuStats = new Map<string, { count: number, name: string }>()

  // 各メニューの初期化
  menus.forEach(menu => {
    menuStats.set(menu.id, { count: 0, name: menu.name })
  })

  // 予約データから診療メニューを集計
  completedAppointments.forEach(apt => {
    if (apt.menu1_id && menuStats.has(apt.menu1_id)) {
      menuStats.get(apt.menu1_id)!.count++
    }
    if (apt.menu2_id && menuStats.has(apt.menu2_id)) {
      menuStats.get(apt.menu2_id)!.count++
    }
    if (apt.menu3_id && menuStats.has(apt.menu3_id)) {
      menuStats.get(apt.menu3_id)!.count++
    }
  })

  // 結果を配列に変換
  const totalAppointments = completedAppointments.length
  const result: TreatmentSalesData[] = []

  menuStats.forEach((stats, menuId) => {
    if (stats.count > 0) {
      const totalSales = stats.count * 35000
      const percentage = totalAppointments > 0 ? (stats.count / totalAppointments) * 100 : 0

      result.push({
        treatment_name: stats.name,
        total_sales: totalSales,
        appointment_count: stats.count,
        percentage: percentage
      })
    }
  })

  // カウント順でソート
  result.sort((a, b) => b.appointment_count - a.appointment_count)

  return result
}

// スタッフ生産性データを取得（拡張版）
async function getStaffProductivityData(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<StaffProductivityData[]> {
  // スタッフ情報を取得（設定ページと同じAPI使用）
  const staff = await getStaff(clinicId)

  if (!staff || staff.length === 0) {
    console.error('スタッフ情報が取得できません')
    return []
  }

  // クリニック設定をAPI Routeから取得（時間枠設定）
  let timeSlotMinutes = 15
  try {
    const clinicSettings = await fetchClinicSettings(clinicId)
    timeSlotMinutes = clinicSettings.time_slot_minutes || 15
  } catch (error) {
    console.error('クリニック設定取得エラー:', error)
  }

  // 全予約データを取得（キャンセルも含む）
  const allAppointments = await getAppointments(clinicId, startDate, endDate)

  // 完了した予約のみを対象
  const completedAppointments = allAppointments.filter(apt =>
    ['来院済み', '診療中', '会計', '終了'].includes(apt.status)
  )

  // 日付範囲を計算
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // クリニックの営業時間を仮定（9:00-18:00 = 9時間）
  const hoursPerDay = 9
  const slotsPerHour = 60 / timeSlotMinutes
  const totalSlotsPerDay = hoursPerDay * slotsPerHour

  // スタッフ別に集計
  const staffStatsMap = new Map<string, {
    staff: any
    appointments: any[]
    bookedSlots: Set<string>
  }>()

  // 各スタッフの初期化（getStaffは既にis_activeでフィルタ済み）
  staff.forEach(s => {
    staffStatsMap.set(s.id, {
      staff: s,
      appointments: [],
      bookedSlots: new Set()
    })
  })

  // 予約データからスタッフを集計（staff1, staff2, staff3）
  allAppointments.forEach(apt => {
    const dateTime = `${apt.date}_${apt.start_time}`

    if (apt.staff1_id && staffStatsMap.has(apt.staff1_id)) {
      const stats = staffStatsMap.get(apt.staff1_id)!
      stats.bookedSlots.add(dateTime)
      if (['来院済み', '診療中', '会計', '終了'].includes(apt.status)) {
        stats.appointments.push(apt)
      }
    }
    if (apt.staff2_id && staffStatsMap.has(apt.staff2_id)) {
      const stats = staffStatsMap.get(apt.staff2_id)!
      stats.bookedSlots.add(dateTime)
      if (['来院済み', '診療中', '会計', '終了'].includes(apt.status)) {
        stats.appointments.push(apt)
      }
    }
    if (apt.staff3_id && staffStatsMap.has(apt.staff3_id)) {
      const stats = staffStatsMap.get(apt.staff3_id)!
      stats.bookedSlots.add(dateTime)
      if (['来院済み', '診療中', '会計', '終了'].includes(apt.status)) {
        stats.appointments.push(apt)
      }
    }
  })

  // 結果を配列に変換
  const result: StaffProductivityData[] = []

  staffStatsMap.forEach((stats, staffId) => {
    const appointmentCount = stats.appointments.length
    const bookedSlots = stats.bookedSlots.size
    const availableSlots = totalSlotsPerDay * daysDiff
    const fillRate = availableSlots > 0 ? (bookedSlots / availableSlots) * 100 : 0

    // 売上計算（仮）
    const totalSales = appointmentCount * 35000
    const salesPerHour = appointmentCount > 0 ? totalSales / (daysDiff * hoursPerDay) : 0
    const averageSalesPerAppointment = appointmentCount > 0 ? totalSales / appointmentCount : 0

    // 治療内容別集計
    const treatmentMap = new Map<string, { menu_id: string, menu_name: string, count: number }>()
    stats.appointments.forEach(apt => {
      if (apt.treatment_menus && Array.isArray(apt.treatment_menus)) {
        apt.treatment_menus.forEach((menu: any) => {
          const key = menu.id || menu.menu_id || 'unknown'
          const name = menu.name || menu.menu_name || '不明'
          if (treatmentMap.has(key)) {
            treatmentMap.get(key)!.count++
          } else {
            treatmentMap.set(key, { menu_id: key, menu_name: name, count: 1 })
          }
        })
      }
    })
    const treatment_breakdown = Array.from(treatmentMap.values())
      .sort((a, b) => b.count - a.count)

    // 日別売上推移
    const dailyMap = new Map<string, { sales: number, count: number }>()
    stats.appointments.forEach(apt => {
      const date = apt.date
      if (dailyMap.has(date)) {
        dailyMap.get(date)!.sales += 35000
        dailyMap.get(date)!.count++
      } else {
        dailyMap.set(date, { sales: 35000, count: 1 })
      }
    })
    const daily_trends = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, sales: data.sales, appointment_count: data.count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 時間帯別統計
    const hourMap = new Map<number, number>()
    stats.appointments.forEach(apt => {
      const hour = parseInt(apt.start_time.split(':')[0])
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    })
    const time_slot_stats = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, appointment_count: count }))
      .sort((a, b) => a.hour - b.hour)

    // 曜日別統計
    const dayOfWeekMap = new Map<number, number>()
    stats.appointments.forEach(apt => {
      const date = new Date(apt.date)
      const dayOfWeek = date.getDay()
      dayOfWeekMap.set(dayOfWeek, (dayOfWeekMap.get(dayOfWeek) || 0) + 1)
    })
    const day_of_week_stats = Array.from(dayOfWeekMap.entries())
      .map(([day_of_week, count]) => ({ day_of_week, appointment_count: count }))
      .sort((a, b) => a.day_of_week - b.day_of_week)

    result.push({
      staff_id: staffId,
      staff_name: stats.staff.name,
      position_name: (stats.staff as any).position?.name || '未設定',
      total_sales: totalSales,
      appointment_count: appointmentCount,
      sales_per_hour: salesPerHour,
      average_sales_per_appointment: averageSalesPerAppointment,
      available_slots: availableSlots,
      booked_slots: bookedSlots,
      fill_rate: fillRate,
      treatment_breakdown,
      daily_trends,
      time_slot_stats,
      day_of_week_stats,
      is_active: stats.staff.is_active !== false
    })
  })

  // 役職順でソート（役職のsort_orderを使用）
  result.sort((a, b) => {
    const staffA = staff.find(s => s.id === a.staff_id)
    const staffB = staff.find(s => s.id === b.staff_id)
    const sortOrderA = (staffA as any)?.position?.sort_order || 999
    const sortOrderB = (staffB as any)?.position?.sort_order || 999
    return sortOrderA - sortOrderB
  })

  return result
}

// スタッフ全体の時間帯別統計を集計
export function aggregateTimeSlotStats(staffData: StaffProductivityData[]): { hour: number, appointment_count: number }[] {
  const hourMap = new Map<number, number>()

  staffData.forEach(staff => {
    staff.time_slot_stats.forEach(stat => {
      hourMap.set(stat.hour, (hourMap.get(stat.hour) || 0) + stat.appointment_count)
    })
  })

  return Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, appointment_count: count }))
    .sort((a, b) => a.hour - b.hour)
}

// スタッフ全体の曜日別統計を集計
export function aggregateDayOfWeekStats(staffData: StaffProductivityData[]): { day_of_week: number, appointment_count: number }[] {
  const dayMap = new Map<number, number>()

  staffData.forEach(staff => {
    staff.day_of_week_stats.forEach(stat => {
      dayMap.set(stat.day_of_week, (dayMap.get(stat.day_of_week) || 0) + stat.appointment_count)
    })
  })

  return Array.from(dayMap.entries())
    .map(([day_of_week, count]) => ({ day_of_week, appointment_count: count }))
    .sort((a, b) => a.day_of_week - b.day_of_week)
}

// 曜日番号を日本語に変換
export function getDayOfWeekName(dayOfWeek: number): string {
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return days[dayOfWeek] || '不明'
}

// 時間帯別分析データを取得
async function getTimeSlotAnalysisData(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<TimeSlotAnalysisData[]> {
  // 実際の予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)

  // 完了した予約のみを対象
  const completedAppointments = appointments.filter(apt =>
    ['来院済み', '診療中', '会計', '終了'].includes(apt.status)
  )

  // 時間帯別に集計（1時間ごと）
  const timeSlotStats = new Map<string, number>()

  // 時間帯の初期化（9:00-18:00）
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
  ]

  timeSlots.forEach(slot => {
    timeSlotStats.set(slot, 0)
  })

  // 予約データから時間帯を集計
  completedAppointments.forEach(apt => {
    const startHour = parseInt(apt.start_time.split(':')[0])
    const endHour = parseInt(apt.end_time.split(':')[0])

    // 予約が該当する時間帯を特定
    for (let hour = startHour; hour < endHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`
      if (timeSlotStats.has(timeSlot)) {
        timeSlotStats.set(timeSlot, timeSlotStats.get(timeSlot)! + 1)
      }
    }
  })

  // 結果を配列に変換
  const result: TimeSlotAnalysisData[] = []

  timeSlots.forEach(slot => {
    const appointmentCount = timeSlotStats.get(slot) || 0
    const totalSales = appointmentCount * 35000
    const utilizationRate = Math.min((appointmentCount / 4) * 100, 100)

    result.push({
      time_slot: slot,
      appointment_count: appointmentCount,
      total_sales: totalSales,
      utilization_rate: utilizationRate
    })
  })

  return result
}

// キャンセル分析データを取得
export async function getCancelAnalysisData(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<CancelAnalysisData> {
  // キャンセル理由マスタをAPI Routeから取得
  let cancelReasons: any[] = []
  try {
    cancelReasons = await fetchCancelReasons(clinicId)
  } catch (error) {
    console.error('キャンセル理由取得エラー:', error)
    return {
      total_cancelled: 0,
      registered_cancelled: 0,
      temporary_cancelled: 0,
      reasons: [],
      daily_stats: []
    }
  }

  // キャンセル理由が存在しない場合もデフォルト値を返す
  if (!cancelReasons || cancelReasons.length === 0) {
    console.warn('キャンセル理由が見つかりません')
    return {
      total_cancelled: 0,
      registered_cancelled: 0,
      temporary_cancelled: 0,
      reasons: [],
      daily_stats: []
    }
  }

  // 実際の予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)

  // キャンセルされた予約のみを対象
  const cancelledAppointments = appointments.filter(apt => apt.status === 'キャンセル')

  // 基本統計
  const total_cancelled = cancelledAppointments.length
  const registered_cancelled = cancelledAppointments.filter(apt => {
    return apt.patient_id && cancelledAppointments.some(ca => ca.patient_id === apt.patient_id)
  }).length
  const temporary_cancelled = total_cancelled - registered_cancelled

  // キャンセル理由別集計（マスタで定義された理由を使用）
  const reasonStats = new Map<string, {
    reason_id: string
    reason_name: string
    count: number
    registered_count: number
    temporary_count: number
  }>()

  // 各理由の初期化
  cancelReasons.forEach(reason => {
    reasonStats.set(reason.id, {
      reason_id: reason.id,
      reason_name: reason.name,
      count: 0,
      registered_count: 0,
      temporary_count: 0
    })
  })

  // キャンセル予約から理由を集計
  cancelledAppointments.forEach(apt => {
    const reasonId = apt.cancel_reason_id || 'unknown'
    const reasonName = apt.cancel_reason?.name || '不明'

    if (!reasonStats.has(reasonId)) {
      reasonStats.set(reasonId, {
        reason_id: reasonId,
        reason_name: reasonName,
        count: 0,
        registered_count: 0,
        temporary_count: 0
      })
    }

    const reason = reasonStats.get(reasonId)!
    reason.count++

    if (apt.patient_id && apt.patient_id.startsWith('temp-')) {
      reason.temporary_count++
    } else {
      reason.registered_count++
    }
  })

  const reasons = Array.from(reasonStats.values()).filter(r => r.count > 0)

  // 日別集計
  const dailyMap = new Map<string, {
    date: string
    total_cancelled: number
    registered_cancelled: number
    temporary_cancelled: number
  }>()

  cancelledAppointments.forEach(apt => {
    const date = apt.appointment_date
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        total_cancelled: 0,
        registered_cancelled: 0,
        temporary_cancelled: 0
      })
    }

    const daily = dailyMap.get(date)!
    daily.total_cancelled++

    if (apt.patient_id && apt.patient_id.startsWith('temp-')) {
      daily.temporary_cancelled++
    } else {
      daily.registered_cancelled++
    }
  })

  const daily_stats = Array.from(dailyMap.values()).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return {
    total_cancelled,
    registered_cancelled,
    temporary_cancelled,
    reasons,
    daily_stats
  }
}

// 時間帯別キャンセル分析データを取得
export async function getTimeSlotCancelAnalysis(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<TimeSlotCancelData[]> {
  // 実際の予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)

  // キャンセルされた予約のみを対象
  const cancelledAppointments = appointments.filter(apt => apt.status === 'キャンセル')

  // 時間帯別に集計（1時間ごと）
  const timeSlotStats = new Map<string, number>()

  // 時間帯の初期化（9:00-18:00）
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
  ]

  timeSlots.forEach(slot => {
    timeSlotStats.set(slot, 0)
  })

  // キャンセル予約から時間帯を集計
  cancelledAppointments.forEach(apt => {
    const startHour = parseInt(apt.start_time.split(':')[0])
    const endHour = parseInt(apt.end_time.split(':')[0])

    for (let hour = startHour; hour < endHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`
      if (timeSlotStats.has(timeSlot)) {
        timeSlotStats.set(timeSlot, timeSlotStats.get(timeSlot)! + 1)
      }
    }
  })

  // 結果を配列に変換
  const result: TimeSlotCancelData[] = []

  timeSlots.forEach(slot => {
    const cancelCount = timeSlotStats.get(slot) || 0
    const cancelRate = cancelledAppointments.length > 0
      ? (cancelCount / cancelledAppointments.length) * 100
      : 0

    result.push({
      time_slot: slot,
      cancel_count: cancelCount,
      cancel_rate: cancelRate
    })
  })

  return result
}

// スタッフ別キャンセル率分析データを取得
export async function getStaffCancelAnalysis(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<StaffCancelData[]> {
  // スタッフ情報をAPI Routeから取得（全スタッフ、非アクティブ含む）
  let staffList: any[] = []
  try {
    const response = await fetch(`${baseUrl}/api/staff?clinic_id=${clinicId}&active_only=false`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) {
      throw new Error('スタッフ情報の取得に失敗しました')
    }
    staffList = await response.json()
  } catch (error) {
    console.error('スタッフ情報取得エラー:', error)
    return []
  }

  // 実際の予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)

  // スタッフ別に集計
  const staffStats = new Map<string, {
    name: string,
    position_name: string,
    total_appointments: number,
    cancelled_appointments: number
  }>()

  // 各スタッフの初期化
  staffList.forEach(s => {
    staffStats.set(s.id, {
      name: s.name,
      position_name: s.position?.name || '不明',
      total_appointments: 0,
      cancelled_appointments: 0
    })
  })

  // 予約データからスタッフを集計
  appointments.forEach(apt => {
    if (apt.staff1_id && staffStats.has(apt.staff1_id)) {
      const stats = staffStats.get(apt.staff1_id)!
      stats.total_appointments++
      if (apt.status === 'キャンセル') {
        stats.cancelled_appointments++
      }
    }
    if (apt.staff2_id && staffStats.has(apt.staff2_id)) {
      const stats = staffStats.get(apt.staff2_id)!
      stats.total_appointments++
      if (apt.status === 'キャンセル') {
        stats.cancelled_appointments++
      }
    }
    if (apt.staff3_id && staffStats.has(apt.staff3_id)) {
      const stats = staffStats.get(apt.staff3_id)!
      stats.total_appointments++
      if (apt.status === 'キャンセル') {
        stats.cancelled_appointments++
      }
    }
  })

  // 結果を配列に変換
  const result: StaffCancelData[] = []

  staffStats.forEach((stats, staffId) => {
    if (stats.total_appointments > 0) {
      const cancelRate = (stats.cancelled_appointments / stats.total_appointments) * 100

      result.push({
        staff_id: staffId,
        staff_name: stats.name,
        position_name: stats.position_name,
        total_appointments: stats.total_appointments,
        cancelled_appointments: stats.cancelled_appointments,
        cancel_rate: cancelRate
      })
    }
  })

  // キャンセル率順でソート
  result.sort((a, b) => b.cancel_rate - a.cancel_rate)

  return result
}

// 診療メニュー別キャンセル率分析データを取得
export async function getTreatmentCancelAnalysis(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<TreatmentCancelData[]> {
  // 診療メニューをAPI Routeから取得
  let menus: any[] = []
  try {
    menus = await fetchTreatmentMenus(clinicId)
  } catch (error) {
    console.error('診療メニュー取得エラー:', error)
    return []
  }

  // 実際の予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)

  // 診療メニュー別に集計
  const menuStats = new Map<string, {
    name: string,
    total_appointments: number,
    cancelled_appointments: number
  }>()

  // 各メニューの初期化
  menus.forEach(menu => {
    menuStats.set(menu.id, {
      name: menu.name,
      total_appointments: 0,
      cancelled_appointments: 0
    })
  })

  // 予約データから診療メニューを集計
  appointments.forEach(apt => {
    if (apt.menu1_id && menuStats.has(apt.menu1_id)) {
      const stats = menuStats.get(apt.menu1_id)!
      stats.total_appointments++
      if (apt.status === 'キャンセル') {
        stats.cancelled_appointments++
      }
    }
    if (apt.menu2_id && menuStats.has(apt.menu2_id)) {
      const stats = menuStats.get(apt.menu2_id)!
      stats.total_appointments++
      if (apt.status === 'キャンセル') {
        stats.cancelled_appointments++
      }
    }
    if (apt.menu3_id && menuStats.has(apt.menu3_id)) {
      const stats = menuStats.get(apt.menu3_id)!
      stats.total_appointments++
      if (apt.status === 'キャンセル') {
        stats.cancelled_appointments++
      }
    }
  })

  // 結果を配列に変換
  const result: TreatmentCancelData[] = []

  menuStats.forEach((stats, menuId) => {
    if (stats.total_appointments > 0) {
      const cancelRate = (stats.cancelled_appointments / stats.total_appointments) * 100

      result.push({
        menu_id: menuId,
        menu_name: stats.name,
        total_appointments: stats.total_appointments,
        cancelled_appointments: stats.cancelled_appointments,
        cancel_rate: cancelRate
      })
    }
  })

  // キャンセル率順でソート
  result.sort((a, b) => b.cancel_rate - a.cancel_rate)

  return result
}


// 診療メニュー別の予約統計を取得
async function getTreatmentMenuStats(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<TreatmentMenuStats[]> {
  // 予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)

  // 診療メニューをAPI Routeから取得（アクティブのみ）
  let menus: any[] = []
  try {
    menus = await fetchTreatmentMenus(clinicId, true)
  } catch (error) {
    console.error('診療メニュー取得エラー:', error)
    return []
  }

  // 全メニューを初期化（0件も含む）
  const menuCountMap = new Map<string, {
    name: string
    count: number
    level: number
    parent_id?: string
    sort_order: number
  }>()

  menus.forEach(menu => {
    menuCountMap.set(menu.id, {
      name: menu.name,
      count: 0,
      level: menu.level,
      parent_id: menu.parent_id || undefined,
      sort_order: menu.sort_order || 0
    })
  })

  // 予約データから診療メニューを集計（キャンセル除外、レベル別に集計）
  appointments.forEach(apt => {
    if (apt.status !== 'キャンセル') {
      // メニュー1（level=1）のみ集計
      if (apt.menu1_id && menuCountMap.has(apt.menu1_id)) {
        const menu = menuCountMap.get(apt.menu1_id)!
        if (menu.level === 1) {
          menu.count++
        }
      }
    }
  })

  // 全メニューを配列に変換（0件も含む）
  const result: TreatmentMenuStats[] = []

  menuCountMap.forEach((data, menuId) => {
    result.push({
      menu_id: menuId,
      treatment_name: data.name,
      appointment_count: data.count,
      level: data.level,
      parent_id: data.parent_id
    })
  })

  // level=1のみをフィルタして、予約数順でソート
  const level1Menus = result.filter(m => m.level === 1)
  level1Menus.sort((a, b) => b.appointment_count - a.appointment_count)

  return level1Menus
}

// 指定した親メニューの子メニュー統計を取得（ドリルダウン用）
export async function getTreatmentMenuStatsByParent(
  clinicId: string,
  startDate: string,
  endDate: string,
  parentMenuId: string,
  targetLevel: 1 | 2 | 3
): Promise<TreatmentMenuStats[]> {
  // 予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)

  // 診療メニューをAPI Routeから取得（アクティブのみ）
  let menus: any[] = []
  try {
    menus = await fetchTreatmentMenus(clinicId, true)
  } catch (error) {
    console.error('診療メニュー取得エラー:', error)
    return []
  }

  // 指定されたlevelのメニューのみを初期化
  const menuCountMap = new Map<string, {
    name: string
    count: number
    level: number
    parent_id?: string
    sort_order: number
  }>()

  menus.forEach(menu => {
    if (menu.level === targetLevel) {
      menuCountMap.set(menu.id, {
        name: menu.name,
        count: 0,
        level: menu.level,
        parent_id: menu.parent_id || undefined,
        sort_order: menu.sort_order || 0
      })
    }
  })

  // 予約データから集計（キャンセル除外）
  appointments.forEach(apt => {
    if (apt.status !== 'キャンセル') {
      if (targetLevel === 1) {
        if (apt.menu1_id && menuCountMap.has(apt.menu1_id)) {
          menuCountMap.get(apt.menu1_id)!.count++
        }
      } else if (targetLevel === 2) {
        if (apt.menu1_id === parentMenuId && apt.menu2_id && menuCountMap.has(apt.menu2_id)) {
          menuCountMap.get(apt.menu2_id)!.count++
        }
      } else if (targetLevel === 3) {
        if (apt.menu2_id === parentMenuId && apt.menu3_id && menuCountMap.has(apt.menu3_id)) {
          menuCountMap.get(apt.menu3_id)!.count++
        }
      }
    }
  })

  // 結果を配列に変換
  const result: TreatmentMenuStats[] = []

  menuCountMap.forEach((data, menuId) => {
    result.push({
      menu_id: menuId,
      treatment_name: data.name,
      appointment_count: data.count,
      level: data.level,
      parent_id: data.parent_id
    })
  })

  // 予約数順でソート
  result.sort((a, b) => b.appointment_count - a.appointment_count)

  return result
}
