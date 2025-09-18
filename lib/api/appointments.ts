import { supabase } from '@/lib/supabase'
import { Appointment, AppointmentInsert, AppointmentUpdate } from '@/types/database'

/**
 * 予約を取得
 */
export async function getAppointments(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:patients(id, last_name, first_name, last_name_kana, first_name_kana, phone),
      unit:units(id, name),
      menu1:treatment_menus!appointments_menu1_id_fkey(id, name, color),
      menu2:treatment_menus!appointments_menu2_id_fkey(id, name, color),
      menu3:treatment_menus!appointments_menu3_id_fkey(id, name, color),
      staff1:staff!appointments_staff1_id_fkey(id, name),
      staff2:staff!appointments_staff2_id_fkey(id, name),
      staff3:staff!appointments_staff3_id_fkey(id, name)
    `)
    .eq('clinic_id', clinicId)

  if (startDate) {
    query = query.gte('appointment_date', startDate)
  }

  if (endDate) {
    query = query.lte('appointment_date', endDate)
  }

  const { data, error } = await query
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('予約取得エラー:', error)
    throw new Error('予約データの取得に失敗しました')
  }

  return data || []
}

/**
 * 特定日の予約を取得
 */
export async function getAppointmentsByDate(
  clinicId: string,
  date: string
): Promise<Appointment[]> {
  return getAppointments(clinicId, date, date)
}

/**
 * 予約詳細を取得
 */
export async function getAppointmentById(
  clinicId: string,
  appointmentId: string
): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients(id, last_name, first_name, last_name_kana, first_name_kana, phone, birth_date, gender),
      unit:units(id, name),
      menu1:treatment_menus!appointments_menu1_id_fkey(id, name, color),
      menu2:treatment_menus!appointments_menu2_id_fkey(id, name, color),
      menu3:treatment_menus!appointments_menu3_id_fkey(id, name, color),
      staff1:staff!appointments_staff1_id_fkey(id, name),
      staff2:staff!appointments_staff2_id_fkey(id, name),
      staff3:staff!appointments_staff3_id_fkey(id, name)
    `)
    .eq('clinic_id', clinicId)
    .eq('id', appointmentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('予約詳細取得エラー:', error)
    throw new Error('予約情報の取得に失敗しました')
  }

  return data
}

/**
 * 予約を新規作成
 */
export async function createAppointment(
  clinicId: string,
  appointmentData: Omit<AppointmentInsert, 'clinic_id'>
): Promise<Appointment> {
  const newAppointment: AppointmentInsert = {
    ...appointmentData,
    clinic_id: clinicId
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert(newAppointment)
    .select()
    .single()

  if (error) {
    console.error('予約作成エラー:', error)
    throw new Error('予約の登録に失敗しました')
  }

  return data
}

/**
 * 予約を更新
 */
export async function updateAppointment(
  clinicId: string,
  appointmentId: string,
  appointmentData: AppointmentUpdate
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .update(appointmentData)
    .eq('clinic_id', clinicId)
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    console.error('予約更新エラー:', error)
    throw new Error('予約情報の更新に失敗しました')
  }

  return data
}

/**
 * 予約ステータスを更新
 */
export async function updateAppointmentStatus(
  clinicId: string,
  appointmentId: string,
  status: string
): Promise<Appointment> {
  return updateAppointment(clinicId, appointmentId, {
    status: status as any,
    updated_at: new Date().toISOString()
  })
}

/**
 * 予約を削除
 */
export async function deleteAppointment(
  clinicId: string,
  appointmentId: string
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('clinic_id', clinicId)
    .eq('id', appointmentId)

  if (error) {
    console.error('予約削除エラー:', error)
    throw new Error('予約の削除に失敗しました')
  }
}

/**
 * 予約統計を取得
 */
export async function getAppointmentStats(clinicId: string, date?: string) {
  let query = supabase
    .from('appointments')
    .select('status')
    .eq('clinic_id', clinicId)

  if (date) {
    query = query.eq('appointment_date', date)
  }

  const { data, error } = await query

  if (error) {
    console.error('予約統計取得エラー:', error)
    throw new Error('予約統計の取得に失敗しました')
  }

  const total = data.length
  const completed = data.filter(a => a.status === '終了').length
  const inProgress = data.filter(a => ['来院済み', '診療中', '会計'].includes(a.status)).length
  const waiting = data.filter(a => a.status === '未来院').length
  const cancelled = data.filter(a => a.status === 'キャンセル').length

  return {
    total,
    completed,
    inProgress,
    waiting,
    cancelled
  }
}