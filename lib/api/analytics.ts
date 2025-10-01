import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { getAppointments } from '@/lib/api/appointments'
import { getPatients } from '@/lib/api/patients'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

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

export interface AnalyticsData {
  kpi: KPIData
  sales_trend: SalesTrendData[]
  treatment_sales: TreatmentSalesData[]
  staff_productivity: StaffProductivityData[]
  time_slot_analysis: TimeSlotAnalysisData[]
}

// 基本分析データを取得
export async function getAnalyticsData(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsData> {
  try {
    // 期間の前月同期間のデータも取得（比較用）
    const prevStartDate = new Date(startDate)
    prevStartDate.setMonth(prevStartDate.getMonth() - 1)
    const prevEndDate = new Date(endDate)
    prevEndDate.setMonth(prevEndDate.getMonth() - 1)

    const prevStartDateStr = prevStartDate.toISOString().split('T')[0]
    const prevEndDateStr = prevEndDate.toISOString().split('T')[0]

    // 並列でデータを取得
    const [
      kpiData,
      salesTrendData,
      treatmentSalesData,
      staffProductivityData,
      timeSlotAnalysisData
    ] = await Promise.all([
      getKPIData(clinicId, startDate, endDate, prevStartDateStr, prevEndDateStr),
      getSalesTrendData(clinicId, startDate, endDate),
      getTreatmentSalesData(clinicId, startDate, endDate),
      getStaffProductivityData(clinicId, startDate, endDate),
      getTimeSlotAnalysisData(clinicId, startDate, endDate)
    ])

    return {
      kpi: kpiData,
      sales_trend: salesTrendData,
      treatment_sales: treatmentSalesData,
      staff_productivity: staffProductivityData,
      time_slot_analysis: timeSlotAnalysisData
    }
  } catch (error) {
    console.error('分析データ取得エラー:', error)
    throw error
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
  const totalSales = completedAppointments * 35000 // 仮の平均売上
  const insuranceSales = Math.floor(totalSales * 0.67) // 67%が保険診療
  const selfPaySales = totalSales - insuranceSales
  const prevTotalSales = prevTotalAppointments * 35000 // 前期間の仮売上

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
    const totalSales = appointmentCount * 35000 // 仮の平均売上
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
  const client = getSupabaseClient()
  
  // 診療メニューを取得
  const { data: menus, error: menusError } = await client
    .from('treatment_menus')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('sort_order')

  if (menusError) {
    console.error('診療メニュー取得エラー:', menusError)
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
  menus?.forEach(menu => {
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
      const totalSales = stats.count * 35000 // 仮の平均売上
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

// スタッフ生産性データを取得
async function getStaffProductivityData(
  clinicId: string,
  startDate: string,
  endDate: string
): Promise<StaffProductivityData[]> {
  const client = getSupabaseClient()
  
  // スタッフ情報を取得
  const { data: staff, error: staffError } = await client
    .from('staff')
    .select(`
      *,
      position:staff_positions(name)
    `)
    .eq('clinic_id', clinicId)
    .eq('is_active', true)

  if (staffError) {
    console.error('スタッフ情報取得エラー:', staffError)
    return []
  }

  // 実際の予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)
  
  // 完了した予約のみを対象
  const completedAppointments = appointments.filter(apt => 
    ['来院済み', '診療中', '会計', '終了'].includes(apt.status)
  )

  // スタッフ別に集計
  const staffStats = new Map<string, { 
    name: string, 
    position_name: string, 
    appointments: any[] 
  }>()

  // 各スタッフの初期化
  staff?.forEach(s => {
    staffStats.set(s.id, {
      name: s.name,
      position_name: s.position?.name || '不明',
      appointments: []
    })
  })

  // 予約データからスタッフを集計
  completedAppointments.forEach(apt => {
    if (apt.staff1_id && staffStats.has(apt.staff1_id)) {
      staffStats.get(apt.staff1_id)!.appointments.push(apt)
    }
    if (apt.staff2_id && staffStats.has(apt.staff2_id)) {
      staffStats.get(apt.staff2_id)!.appointments.push(apt)
    }
    if (apt.staff3_id && staffStats.has(apt.staff3_id)) {
      staffStats.get(apt.staff3_id)!.appointments.push(apt)
    }
  })

  // 結果を配列に変換
  const result: StaffProductivityData[] = []
  
  staffStats.forEach((stats, staffId) => {
    const appointmentCount = stats.appointments.length
    if (appointmentCount > 0) {
      const totalSales = appointmentCount * 35000 // 仮の平均売上
      const salesPerHour = appointmentCount * 4375 // 仮の時間あたり売上（8時間勤務想定）
      const averageSalesPerAppointment = totalSales / appointmentCount
      
      result.push({
        staff_id: staffId,
        staff_name: stats.name,
        position_name: stats.position_name,
        total_sales: totalSales,
        appointment_count: appointmentCount,
        sales_per_hour: salesPerHour,
        average_sales_per_appointment: averageSalesPerAppointment
      })
    }
  })

  // 売上順でソート
  result.sort((a, b) => b.total_sales - a.total_sales)

  return result
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
    const totalSales = appointmentCount * 35000 // 仮の平均売上
    const utilizationRate = Math.min((appointmentCount / 4) * 100, 100) // 仮の最大稼働率（1時間に4件想定）
    
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
  const client = getSupabaseClient()
  
  // キャンセル理由マスタを取得
  const { data: cancelReasons, error: reasonsError } = await client
    .from('cancel_reasons')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('sort_order')

  if (reasonsError) {
    console.error('キャンセル理由取得エラー:', reasonsError)
    throw reasonsError
  }

  // 実際の予約データを取得
  const appointments = await getAppointments(clinicId, startDate, endDate)
  
  // キャンセルされた予約のみを対象
  const cancelledAppointments = appointments.filter(apt => apt.status === 'キャンセル')

  // 基本統計
  const total_cancelled = cancelledAppointments.length
  const registered_cancelled = cancelledAppointments.filter(apt => {
    // 患者情報を取得して本登録かどうか判定
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
  cancelReasons?.forEach(reason => {
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
    // キャンセル理由IDが設定されている場合はそれを使用
    // 設定されていない場合は「不明」として処理
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
    
    // 本登録・仮登録の判定（簡易版）
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
    
    // 予約が該当する時間帯を特定
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
  const client = getSupabaseClient()
  
  // スタッフ情報を取得
  const { data: staff, error: staffError } = await client
    .from('staff')
    .select(`
      *,
      position:staff_positions(name)
    `)
    .eq('clinic_id', clinicId)
    .eq('is_active', true)

  if (staffError) {
    console.error('スタッフ情報取得エラー:', staffError)
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
  staff?.forEach(s => {
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
  const client = getSupabaseClient()
  
  // 診療メニューを取得
  const { data: menus, error: menusError } = await client
    .from('treatment_menus')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('sort_order')

  if (menusError) {
    console.error('診療メニュー取得エラー:', menusError)
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
  menus?.forEach(menu => {
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
