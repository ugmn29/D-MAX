import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { Appointment, AppointmentInsert, AppointmentUpdate } from '@/types/database'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

/**
 * 予約を取得
 */
export async function getAppointments(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<Appointment[]> {
  // モックモードの場合はlocalStorageから取得
  if (MOCK_MODE) {
    console.log('モックモード: 予約データを取得します', { clinicId, startDate, endDate })
    const { getMockAppointments, getMockStaff, getMockTreatmentMenus, updateMockAppointment } = await import('@/lib/utils/mock-mode')
    const appointments = getMockAppointments()
    
    console.log('モックモード: localStorageの全予約データ:', appointments)
    
    // 既存の予約データにスタッフ情報、メニュー情報、患者情報を追加（不足している場合）
    const staff = getMockStaff()
    const menus = getMockTreatmentMenus()
    const { getMockPatients } = await import('@/lib/utils/mock-mode')
    const patients = getMockPatients()
    
    for (const appointment of appointments) {
      let needsUpdate = false
      const updatedAppointment = { ...appointment }
      
      // スタッフ情報を追加
      if (!(appointment as any).staff1 && appointment.staff1_id) {
        const staff1 = staff.find(s => s.id === appointment.staff1_id)
        if (staff1) {
          (updatedAppointment as any).staff1 = staff1
          needsUpdate = true
        }
      }
      if (!(appointment as any).staff2 && appointment.staff2_id) {
        const staff2 = staff.find(s => s.id === appointment.staff2_id)
        if (staff2) {
          (updatedAppointment as any).staff2 = staff2
          needsUpdate = true
        }
      }
      if (!(appointment as any).staff3 && appointment.staff3_id) {
        const staff3 = staff.find(s => s.id === appointment.staff3_id)
        if (staff3) {
          (updatedAppointment as any).staff3 = staff3
          needsUpdate = true
        }
      }
      
      // メニュー情報を追加
      if (!(appointment as any).menu1 && appointment.menu1_id) {
        const menu1 = menus.find(m => m.id === appointment.menu1_id)
        if (menu1) {
          (updatedAppointment as any).menu1 = menu1
          needsUpdate = true
        }
      }
      if (!(appointment as any).menu2 && appointment.menu2_id) {
        const menu2 = menus.find(m => m.id === appointment.menu2_id)
        if (menu2) {
          (updatedAppointment as any).menu2 = menu2
          needsUpdate = true
        }
      }
      if (!(appointment as any).menu3 && appointment.menu3_id) {
        const menu3 = menus.find(m => m.id === appointment.menu3_id)
        if (menu3) {
          (updatedAppointment as any).menu3 = menu3
          needsUpdate = true
        }
      }
      
      // 患者情報を追加
      if (!(appointment as any).patient && appointment.patient_id) {
        const patient = patients.find(p => p.id === appointment.patient_id)
        console.log('患者情報検索:', {
          appointmentId: appointment.id,
          patientId: appointment.patient_id,
          foundPatient: patient,
          allPatients: patients.map(p => ({ id: p.id, name: `${p.last_name} ${p.first_name}` }))
        })
        if (patient) {
          (updatedAppointment as any).patient = patient
          needsUpdate = true
          console.log('患者情報を追加:', patient)
        }
      }
      
      // 更新が必要な場合は保存
      if (needsUpdate) {
        updateMockAppointment(appointment.id, updatedAppointment)
      }
    }
    
    // 更新されたデータを再取得
    const updatedAppointments = getMockAppointments()
    
    // 日付でフィルタリング
    let filteredAppointments = updatedAppointments
    if (startDate) {
      console.log('日付フィルタリング（開始）:', startDate)
      filteredAppointments = filteredAppointments.filter(apt => {
        console.log('予約日付:', apt.appointment_date, '比較対象:', startDate, '結果:', apt.appointment_date >= startDate)
        return apt.appointment_date >= startDate
      })
    }
    if (endDate) {
      console.log('日付フィルタリング（終了）:', endDate)
      filteredAppointments = filteredAppointments.filter(apt => {
        console.log('予約日付:', apt.appointment_date, '比較対象:', endDate, '結果:', apt.appointment_date <= endDate)
        return apt.appointment_date <= endDate
      })
    }
    
    console.log('モックモード: フィルタリング後の予約データ:', filteredAppointments)
    return filteredAppointments
  }

  const client = getSupabaseClient()
  let query = client
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
  // モックモードの場合はnullを返す
  if (MOCK_MODE) {
    console.log('モックモード: 予約詳細データを返します（null）', { clinicId, appointmentId })
    return null
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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
  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    console.log('モックモード: 予約を作成します', { clinicId, appointmentData })
    const { addMockAppointment, getMockPatients, getMockTreatmentMenus } = await import('@/lib/utils/mock-mode')
    
    // 患者情報を取得
    const patients = getMockPatients()
    const patient = patients.find(p => p.id === appointmentData.patient_id)
    console.log('モックモード: 患者情報:', patient)
    
    // メニュー情報を取得
    const menus = getMockTreatmentMenus()
    const menu1 = appointmentData.menu1_id ? menus.find(m => m.id === appointmentData.menu1_id) : null
    const menu2 = appointmentData.menu2_id ? menus.find(m => m.id === appointmentData.menu2_id) : null
    const menu3 = appointmentData.menu3_id ? menus.find(m => m.id === appointmentData.menu3_id) : null
    console.log('モックモード: メニュー情報:', { menu1, menu2, menu3 })
    
    // スタッフ情報を取得
    const { getMockStaff } = await import('@/lib/utils/mock-mode')
    const staff = getMockStaff()
    const staff1 = appointmentData.staff1_id ? staff.find(s => s.id === appointmentData.staff1_id) : null
    const staff2 = appointmentData.staff2_id ? staff.find(s => s.id === appointmentData.staff2_id) : null
    const staff3 = appointmentData.staff3_id ? staff.find(s => s.id === appointmentData.staff3_id) : null
    console.log('モックモード: スタッフ情報:', { staff1, staff2, staff3 })
    
    const mockAppointment: Appointment = {
      id: `mock-appointment-${Date.now()}`,
      clinic_id: clinicId,
      ...appointmentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // 関連データを含める
      patient: patient ? {
        id: patient.id,
        last_name: patient.last_name,
        first_name: patient.first_name,
        last_name_kana: patient.last_name_kana,
        first_name_kana: patient.first_name_kana,
        phone: patient.phone,
        patient_number: patient.patient_number,
        birth_date: patient.birth_date
      } : null,
      menu1: menu1,
      menu2: menu2,
      menu3: menu3,
      staff1: staff1,
      staff2: staff2,
      staff3: staff3
    } as Appointment
    
    console.log('モックモード: 保存する予約データ:', mockAppointment)
    const savedAppointment = addMockAppointment(mockAppointment)
    console.log('モックモード: 保存完了:', savedAppointment)
    
    return savedAppointment
  }

  const newAppointment: AppointmentInsert = {
    ...appointmentData,
    clinic_id: clinicId
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('appointments')
    .insert(newAppointment as any)
    .select()
    .single()

  if (error) {
    console.error('予約作成エラー:', error)
    throw new Error('予約の登録に失敗しました')
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
  return updateAppointment(appointmentId, {
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
  // モックモードの場合は何もしない
  if (MOCK_MODE) {
    console.log('モックモード: 予約を削除します', { clinicId, appointmentId })
    return
  }

  const client = getSupabaseClient()
  const { error } = await client
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
  // モックモードの場合は空の統計を返す
  if (MOCK_MODE) {
    console.log('モックモード: 予約統計を返します（空の統計）', { clinicId, date })
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      waiting: 0,
      cancelled: 0
    }
  }

  const client = getSupabaseClient()
  let query = client
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

/**
 * 予約を更新
 */
export async function updateAppointment(
  appointmentId: string,
  appointmentData: Partial<AppointmentUpdate>
): Promise<Appointment> {
  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    console.log('モックモード: 予約を更新します', { appointmentId, appointmentData })
    const { updateMockAppointment, getMockPatients, getMockTreatmentMenus, getMockStaff } = await import('@/lib/utils/mock-mode')
    
    // 関連データを取得して埋め込む
    const patients = getMockPatients()
    const menus = getMockTreatmentMenus()
    const staff = getMockStaff()
    
    const patient = appointmentData.patient_id ? patients.find(p => p.id === appointmentData.patient_id) : null
    const menu1 = appointmentData.menu1_id ? menus.find(m => m.id === appointmentData.menu1_id) : null
    const menu2 = appointmentData.menu2_id ? menus.find(m => m.id === appointmentData.menu2_id) : null
    const menu3 = appointmentData.menu3_id ? menus.find(m => m.id === appointmentData.menu3_id) : null
    const staff1 = appointmentData.staff1_id ? staff.find(s => s.id === appointmentData.staff1_id) : null
    const staff2 = appointmentData.staff2_id ? staff.find(s => s.id === appointmentData.staff2_id) : null
    const staff3 = appointmentData.staff3_id ? staff.find(s => s.id === appointmentData.staff3_id) : null
    
    const updatedData = {
      ...appointmentData,
      updated_at: new Date().toISOString(),
      // 関連データを含める
      patient: patient ? {
        id: patient.id,
        last_name: patient.last_name,
        first_name: patient.first_name,
        last_name_kana: patient.last_name_kana,
        first_name_kana: patient.first_name_kana,
        phone: patient.phone,
        patient_number: patient.patient_number,
        birth_date: patient.birth_date
      } : null,
      menu1: menu1,
      menu2: menu2,
      menu3: menu3,
      staff1: staff1,
      staff2: staff2,
      staff3: staff3
    }
    
    console.log('モックモード: 更新する予約データ:', updatedData)
    console.log('モックモード: 更新対象ID:', appointmentId)
    
    const updatedAppointment = updateMockAppointment(appointmentId, updatedData)
    console.log('モックモード: updateMockAppointmentの戻り値:', updatedAppointment)
    
    if (!updatedAppointment) {
      console.error('モックモード: 予約の更新に失敗しました。IDが見つかりません:', appointmentId)
      throw new Error('予約の更新に失敗しました')
    }
    
    console.log('モックモード: 更新完了:', updatedAppointment)
    return updatedAppointment
  }

  // 通常モードの場合
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('appointments')
    .update({
      ...appointmentData,
      updated_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    console.error('予約更新エラー:', error)
    throw error
  }

  return data
}