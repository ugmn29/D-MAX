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
    const { getMockAppointments, getMockStaff, getMockTreatmentMenus, updateMockAppointment, initializeMockData } = await import('@/lib/utils/mock-mode')
    
    // モックデータを初期化
    initializeMockData()
    
    const appointments = getMockAppointments()
    
    console.log('モックモード: localStorageの全予約データ:', appointments)
    
    // 既存の予約データにスタッフ情報、メニュー情報、患者情報を追加（不足している場合）
    const staff = getMockStaff()
    const menus = getMockTreatmentMenus()
    const { getMockPatients } = await import('@/lib/utils/mock-mode')
    const patients = getMockPatients()
    
    console.log('モックモード: 予約データの患者情報を更新開始', { appointmentCount: appointments.length })
    for (const appointment of appointments) {
      let needsUpdate = false
      const updatedAppointment = { ...appointment }
      console.log('モックモード: 予約を処理中', { appointmentId: appointment.id, patientId: appointment.patient_id })
      
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
      
      // 患者情報を追加または更新
      if (appointment.patient_id) {
        let patient = (appointment as any).patient || patients.find(p => p.id === appointment.patient_id)

        if (!patient) {
          console.log('患者情報検索:', {
            appointmentId: appointment.id,
            patientId: appointment.patient_id,
            foundPatient: patient,
            allPatients: patients.map(p => ({ id: p.id, name: `${p.last_name} ${p.first_name}` }))
          })

          // Web予約の仮患者でlocalStorageに見つからない場合、notesから復元
          if (appointment.patient_id?.startsWith('web-booking-temp-') && appointment.memo) {
            console.log('警告: Web予約の患者がlocalStorageに見つかりません。notesから復元を試みます。')
            const notes = appointment.memo
            const nameMatch = notes.match(/氏名:\s*(.+)/)
            const phoneMatch = notes.match(/電話:\s*(.+)/)

            patient = {
              id: appointment.patient_id,
              clinic_id: clinicId,
              last_name: nameMatch ? nameMatch[1].trim() : 'Web予約',
              first_name: '',
              last_name_kana: '',
              first_name_kana: '',
              phone: phoneMatch ? phoneMatch[1].trim() : '',
              patient_number: '',
              birth_date: null,
              is_registered: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            console.log('Web予約の仮患者情報をnotesから復元（仮登録）:', patient)
          }
        }

        if (patient) {
          // 常に最新の患者アイコン情報をデータベースから取得
          console.log('モックモード: 患者アイコン取得開始', { patientId: patient.id, patientName: `${patient.last_name} ${patient.first_name}` })
          const { getPatientIcons } = await import('@/lib/api/patient-icons')
          try {
            const patientIconsData = await getPatientIcons(patient.id, clinicId)
            console.log('モックモード: 患者アイコン取得成功', { patientId: patient.id, iconIds: patientIconsData?.icon_ids })
            ;(updatedAppointment as any).patient = {
              ...patient,
              icon_ids: patientIconsData?.icon_ids || []
            }
          } catch (error) {
            console.error('患者アイコン取得エラー:', error)
            ;(updatedAppointment as any).patient = {
              ...patient,
              icon_ids: []
            }
          }
          needsUpdate = true
          console.log('モックモード: 患者情報を追加/更新完了', {
            patientId: patient.id,
            patientName: `${patient.last_name} ${patient.first_name}`,
            icon_ids: (updatedAppointment as any).patient.icon_ids
          })
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
      patient:patients(id, last_name, first_name, last_name_kana, first_name_kana, phone, birth_date, gender, is_registered, patient_number),
      unit:units(id, name),
      menu1:treatment_menus!appointments_menu1_id_fkey(id, name, color, standard_duration),
      menu2:treatment_menus!appointments_menu2_id_fkey(id, name, color, standard_duration),
      menu3:treatment_menus!appointments_menu3_id_fkey(id, name, color, standard_duration),
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

  // 時間フィールドから秒数を削除 (HH:MM:SS -> HH:MM)
  const appointments = (data || []).map(appointment => ({
    ...appointment,
    start_time: appointment.start_time?.slice(0, 5) || appointment.start_time,
    end_time: appointment.end_time?.slice(0, 5) || appointment.end_time
  }))

  // 各予約に患者アイコン情報を追加
  console.log('データベースモード: 患者アイコン情報を取得開始', { appointmentCount: appointments.length })
  const { getPatientIcons } = await import('@/lib/api/patient-icons')

  const appointmentsWithIcons = await Promise.all(
    appointments.map(async (appointment) => {
      if (appointment.patient_id && (appointment as any).patient) {
        try {
          console.log('データベースモード: 患者アイコン取得中', {
            patientId: appointment.patient_id,
            patientName: `${(appointment as any).patient.last_name} ${(appointment as any).patient.first_name}`
          })
          const patientIconsData = await getPatientIcons(appointment.patient_id, clinicId)
          console.log('データベースモード: 患者アイコン取得成功', {
            patientId: appointment.patient_id,
            iconIds: patientIconsData?.icon_ids
          })

          return {
            ...appointment,
            patient: {
              ...(appointment as any).patient,
              icon_ids: patientIconsData?.icon_ids || []
            }
          }
        } catch (error) {
          console.error('データベースモード: 患者アイコン取得エラー', { patientId: appointment.patient_id, error })
          return {
            ...appointment,
            patient: {
              ...(appointment as any).patient,
              icon_ids: []
            }
          }
        }
      }
      return appointment
    })
  )

  console.log('データベースモード: 患者アイコン情報の取得完了')
  return appointmentsWithIcons
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
      patient:patients(id, last_name, first_name, last_name_kana, first_name_kana, phone, birth_date, gender, is_registered, patient_number),
      unit:units(id, name),
      menu1:treatment_menus!appointments_menu1_id_fkey(id, name, color, standard_duration),
      menu2:treatment_menus!appointments_menu2_id_fkey(id, name, color, standard_duration),
      menu3:treatment_menus!appointments_menu3_id_fkey(id, name, color, standard_duration),
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

  // 時間フィールドから秒数を削除 (HH:MM:SS -> HH:MM)
  if (data) {
    return {
      ...data,
      start_time: data.start_time?.slice(0, 5) || data.start_time,
      end_time: data.end_time?.slice(0, 5) || data.end_time
    }
  }

  return data
}

/**
 * 予約を新規作成
 * 複数スタッフの場合は、独立した予約レコードとして分割保存
 */
export async function createAppointment(
  clinicId: string,
  appointmentData: Omit<AppointmentInsert, 'clinic_id'>
): Promise<Appointment> {
  // 複数スタッフがある場合は分割して保存
  const hasMultipleStaff =
    (appointmentData.staff1_id && appointmentData.menu1_id) &&
    ((appointmentData.staff2_id && appointmentData.menu2_id) ||
     (appointmentData.staff3_id && appointmentData.menu3_id))

  if (hasMultipleStaff) {
    console.log('複数スタッフの予約を分割して作成します')
    return createMultiStaffAppointments(clinicId, appointmentData)
  }

  // 単一スタッフの場合は従来通り
  return createSingleAppointment(clinicId, appointmentData)
}

/**
 * 複数スタッフの予約を独立した予約レコードとして作成
 */
async function createMultiStaffAppointments(
  clinicId: string,
  appointmentData: Omit<AppointmentInsert, 'clinic_id'>
): Promise<Appointment> {
  // メニュー情報を取得して標準時間を確認
  const { getTreatmentMenus } = await import('./treatment')
  const allMenus = await getTreatmentMenus(clinicId)

  const appointments: Array<{
    staffId: string
    menuId: string
    startTime: string
    endTime: string
  }> = []

  let currentStartTime = appointmentData.start_time

  // staff1/menu1
  if (appointmentData.staff1_id && appointmentData.menu1_id) {
    const menu1 = allMenus.find(m => m.id === appointmentData.menu1_id)
    const duration = menu1?.standard_duration || 30
    const startMinutes = timeToMinutes(currentStartTime)
    const endMinutes = startMinutes + duration
    const endTime = minutesToTime(endMinutes)

    appointments.push({
      staffId: appointmentData.staff1_id,
      menuId: appointmentData.menu1_id,
      startTime: currentStartTime,
      endTime: endTime
    })
    currentStartTime = endTime
  }

  // staff2/menu2
  if (appointmentData.staff2_id && appointmentData.menu2_id) {
    const menu2 = allMenus.find(m => m.id === appointmentData.menu2_id)
    const duration = menu2?.standard_duration || 30
    const startMinutes = timeToMinutes(currentStartTime)
    const endMinutes = startMinutes + duration
    const endTime = minutesToTime(endMinutes)

    appointments.push({
      staffId: appointmentData.staff2_id,
      menuId: appointmentData.menu2_id,
      startTime: currentStartTime,
      endTime: endTime
    })
    currentStartTime = endTime
  }

  // staff3/menu3
  if (appointmentData.staff3_id && appointmentData.menu3_id) {
    const menu3 = allMenus.find(m => m.id === appointmentData.menu3_id)
    const duration = menu3?.standard_duration || 30
    const startMinutes = timeToMinutes(currentStartTime)
    const endMinutes = startMinutes + duration
    const endTime = minutesToTime(endMinutes)

    appointments.push({
      staffId: appointmentData.staff3_id,
      menuId: appointmentData.menu3_id,
      startTime: currentStartTime,
      endTime: endTime
    })
  }

  console.log(`複数スタッフの予約を${appointments.length}件の独立した予約に分割します`, appointments)

  // 各予約を独立して作成
  const createdAppointments: Appointment[] = []

  for (const appt of appointments) {
    const singleAppointmentData = {
      ...appointmentData,
      staff1_id: appt.staffId,
      staff2_id: null,
      staff3_id: null,
      menu1_id: appt.menuId,
      menu2_id: null,
      menu3_id: null,
      start_time: appt.startTime,
      end_time: appt.endTime
    }

    const created = await createSingleAppointment(clinicId, singleAppointmentData)
    createdAppointments.push(created)
    console.log(`予約${createdAppointments.length}/${appointments.length}を作成しました:`, {
      id: created.id,
      staff: appt.staffId,
      menu: appt.menuId,
      time: `${appt.startTime}-${appt.endTime}`
    })
  }

  console.log(`${appointments.length}件の独立した予約を作成完了`)

  // 最初の予約を返す（互換性のため）
  return createdAppointments[0]
}

/**
 * 単一予約を作成（従来のロジック）
 */
async function createSingleAppointment(
  clinicId: string,
  appointmentData: Omit<AppointmentInsert, 'clinic_id'>
): Promise<Appointment> {
  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    console.log('モックモード: 予約を作成します', { clinicId, appointmentData })
    const { addMockAppointment, getMockPatients, getMockTreatmentMenus } = await import('@/lib/utils/mock-mode')

    // 患者情報を取得（Web予約の仮患者の場合は仮患者情報を作成）
    const patients = getMockPatients()
    let patient = patients.find(p => p.id === appointmentData.patient_id)

    // Web予約の仮患者の場合
    if (!patient && appointmentData.patient_id?.startsWith('web-booking-temp-')) {
      // notesから患者情報を抽出
      const notes = appointmentData.memo || ''
      const nameMatch = notes.match(/氏名:\s*(.+)/)
      const phoneMatch = notes.match(/電話:\s*(.+)/)

      patient = {
        id: appointmentData.patient_id,
        clinic_id: clinicId,
        last_name: nameMatch ? nameMatch[1].trim() : 'Web予約',
        first_name: '',
        last_name_kana: '',
        first_name_kana: '',
        phone: phoneMatch ? phoneMatch[1].trim() : '',
        patient_number: '',
        birth_date: null,
        is_registered: false, // 仮登録状態
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      console.log('モックモード: Web予約の仮患者情報を作成:', patient)

      // 仮患者情報をlocalStorageに保存
      const { addMockPatient } = await import('@/lib/utils/mock-mode')
      addMockPatient(patient)
      console.log('モックモード: 仮患者情報をlocalStorageに保存しました')
    }

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
      status: appointmentData.status || '未来院', // デフォルトステータスを設定
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
        birth_date: patient.birth_date,
        is_registered: patient.is_registered
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

    // 予約作成ログを記録
    const { logAppointmentCreation } = await import('./appointment-logs')
    await logAppointmentCreation(
      savedAppointment.id,
      appointmentData.patient_id || '',
      {
        appointment_date: appointmentData.appointment_date,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        menu1_id: appointmentData.menu1_id,
        staff1_id: appointmentData.staff1_id,
        status: appointmentData.status || '未来院',
        memo: appointmentData.memo
      },
      null
    )

    return savedAppointment
  }

  const newAppointment: AppointmentInsert = {
    ...appointmentData,
    clinic_id: clinicId,
    // 空文字列のUUIDをnullに変換
    menu1_id: appointmentData.menu1_id || null,
    menu2_id: appointmentData.menu2_id || null,
    menu3_id: appointmentData.menu3_id || null,
    staff1_id: appointmentData.staff1_id || null,
    staff2_id: appointmentData.staff2_id || null,
    staff3_id: appointmentData.staff3_id || null,
    unit_id: appointmentData.unit_id || null
  }

  console.log('予約作成データ:', JSON.stringify(newAppointment, null, 2))

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('appointments')
    .insert(newAppointment as any)
    .select()
    .single()

  if (error) {
    console.error('予約作成エラー詳細:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw new Error(`予約の登録に失敗しました: ${error.message}`)
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
  // モックモードの場合
  if (MOCK_MODE) {
    console.log('モックモード: 予約を削除します', { clinicId, appointmentId })
    const { getMockAppointments, removeMockAppointment } = await import('@/lib/utils/mock-mode')

    // 削除前のデータを取得（ログ記録用）
    const appointments = getMockAppointments()
    const appointmentToDelete = appointments.find(a => a.id === appointmentId)

    if (appointmentToDelete) {
      // 削除ログを記録
      const { createAppointmentLog } = await import('./appointment-logs')
      await createAppointmentLog({
        appointment_id: appointmentId,
        action: '削除',
        before_data: {
          appointment_date: appointmentToDelete.appointment_date,
          start_time: appointmentToDelete.start_time,
          end_time: appointmentToDelete.end_time,
          staff1_id: appointmentToDelete.staff1_id,
          menu1_id: appointmentToDelete.menu1_id,
          status: appointmentToDelete.status,
          memo: appointmentToDelete.memo
        },
        reason: '予約を削除しました',
        operator_id: null
      })

      // 実際に削除
      removeMockAppointment(appointmentId)
    }

    return
  }

  const client = getSupabaseClient()

  // 削除前のデータを取得（ログ記録用）
  const { data: appointmentToDelete } = await client
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single()

  const { error } = await client
    .from('appointments')
    .delete()
    .eq('clinic_id', clinicId)
    .eq('id', appointmentId)

  if (error) {
    console.error('予約削除エラー:', error)
    throw new Error('予約の削除に失敗しました')
  }

  // 削除ログを記録
  if (appointmentToDelete) {
    const { createAppointmentLog } = await import('./appointment-logs')
    await createAppointmentLog({
      appointment_id: appointmentId,
      action: '削除',
      before_data: {
        appointment_date: appointmentToDelete.appointment_date,
        start_time: appointmentToDelete.start_time,
        end_time: appointmentToDelete.end_time,
        staff1_id: appointmentToDelete.staff1_id,
        menu1_id: appointmentToDelete.menu1_id,
        status: appointmentToDelete.status,
        memo: appointmentToDelete.memo
      },
      reason: '予約を削除しました',
      operator_id: null
    })
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
    const mockUtils = await import('@/lib/utils/mock-mode')
    const { updateMockAppointment, getMockPatients, getMockTreatmentMenus, getMockStaff, getMockAppointments } = mockUtils

    // 更新前のデータを取得（ログ記録用）
    const allAppointmentsBefore = getMockAppointments()
    const oldAppointment = allAppointmentsBefore.find(a => a.id === appointmentId)

    // 関連データを取得して埋め込む
    const patients = getMockPatients()
    const menus = getMockTreatmentMenus()
    const staff = getMockStaff()

    let patient = appointmentData.patient_id ? patients.find(p => p.id === appointmentData.patient_id) : null

    // Web予約の仮患者でまだlocalStorageに保存されていない場合
    if (!patient && appointmentData.patient_id?.startsWith('web-booking-temp-') && appointmentData.memo) {
      const notes = appointmentData.memo
      const nameMatch = notes.match(/氏名:\s*(.+)/)
      const phoneMatch = notes.match(/電話:\s*(.+)/)

      patient = {
        id: appointmentData.patient_id,
        clinic_id: '',
        last_name: nameMatch ? nameMatch[1].trim() : 'Web予約',
        first_name: '',
        last_name_kana: '',
        first_name_kana: '',
        phone: phoneMatch ? phoneMatch[1].trim() : '',
        patient_number: '',
        birth_date: null,
        is_registered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      console.log('モックモード: 更新時にWeb予約の仮患者情報を復元:', patient)
    }
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
        birth_date: patient.birth_date,
        is_registered: patient.is_registered
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

    // 予約変更ログを記録
    if (oldAppointment) {
      const { logAppointmentChange } = await import('./appointment-logs')
      await logAppointmentChange(
        appointmentId,
        updatedAppointment.patient_id || oldAppointment.patient_id || '',
        {
          appointment_date: oldAppointment.appointment_date,
          start_time: oldAppointment.start_time,
          end_time: oldAppointment.end_time,
          staff1_id: oldAppointment.staff1_id,
          menu1_id: oldAppointment.menu1_id,
          status: oldAppointment.status,
          memo: oldAppointment.memo
        },
        {
          appointment_date: updatedAppointment.appointment_date,
          start_time: updatedAppointment.start_time,
          end_time: updatedAppointment.end_time,
          staff1_id: updatedAppointment.staff1_id,
          menu1_id: updatedAppointment.menu1_id,
          status: updatedAppointment.status,
          memo: updatedAppointment.memo
        },
        null,
        '予約情報を更新しました'
      )
    }

    console.log('モックモード: 更新完了:', updatedAppointment)
    return updatedAppointment
  }

  // 通常モードの場合
  const supabase = getSupabaseClient()

  // 更新前のデータを取得してログに記録
  const { data: oldData } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single()

  // durationフィールドを除外（appointmentsテーブルにはdurationカラムが存在しない）
  const { duration, ...validAppointmentData } = appointmentData as any

  // 更新データをログ出力
  const updateData = {
    ...validAppointmentData,
    updated_at: new Date().toISOString()
  }
  console.log('予約更新データ:', updateData)
  if (duration !== undefined) {
    console.log('除外されたduration:', duration)
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    console.error('予約更新エラー:', error)
    console.error('予約更新エラー詳細:', JSON.stringify(error, null, 2))
    console.error('送信したデータ:', updateData)
    throw error
  }

  // 予約変更ログを記録
  if (oldData) {
    const { logAppointmentChange } = await import('./appointment-logs')
    await logAppointmentChange(
      appointmentId,
      data.patient_id || oldData.patient_id || '',
      {
        appointment_date: oldData.appointment_date,
        start_time: oldData.start_time,
        end_time: oldData.end_time,
        staff1_id: oldData.staff1_id,
        menu1_id: oldData.menu1_id,
        status: oldData.status,
        memo: oldData.memo
      },
      {
        appointment_date: data.appointment_date,
        start_time: data.start_time,
        end_time: data.end_time,
        staff1_id: data.staff1_id,
        menu1_id: data.menu1_id,
        status: data.status,
        memo: data.memo
      },
      null,
      '予約情報を更新しました'
    )
  }

  return data
}

/**
 * 予約をキャンセル
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelReasonId: string,
  cancelledBy?: string,
  additionalMemo?: string
): Promise<Appointment> {
  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    console.log('モックモード: 予約をキャンセルします', { appointmentId, cancelReasonId, cancelledBy, additionalMemo })
    const { updateMockAppointment, getMockCancelReasons, getMockAppointments } = await import('@/lib/utils/mock-mode')

    // 既存の予約データを取得
    const appointments = getMockAppointments()
    const currentAppointment = appointments.find(apt => apt.id === appointmentId)
    const existingMemo = currentAppointment?.memo || ''

    // 既存メモに追記（キャンセルメモがある場合のみ）
    let updatedMemo = existingMemo
    if (additionalMemo && additionalMemo.trim()) {
      updatedMemo = existingMemo
        ? `${existingMemo}\n\n[キャンセル時メモ]\n${additionalMemo}`
        : `[キャンセル時メモ]\n${additionalMemo}`
    }

    const cancelReason = getMockCancelReasons().find(r => r.id === cancelReasonId)

    const updatedAppointment = {
      status: 'キャンセル' as any,
      cancel_reason_id: cancelReasonId,
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      memo: updatedMemo,
      updated_at: new Date().toISOString()
    }

    updateMockAppointment(appointmentId, updatedAppointment)

    // 更新されたデータを再取得
    const updatedAppointments = getMockAppointments()
    const appointment = updatedAppointments.find(apt => apt.id === appointmentId)

    if (!appointment) {
      throw new Error('予約が見つかりません')
    }

    // キャンセルログを記録
    if (currentAppointment) {
      const { createAppointmentLog } = await import('./appointment-logs')
      await createAppointmentLog({
        appointment_id: appointmentId,
        action: 'キャンセル',
        before_data: {
          status: currentAppointment.status,
          appointment_date: currentAppointment.appointment_date,
          start_time: currentAppointment.start_time,
          end_time: currentAppointment.end_time,
          staff1_id: currentAppointment.staff1_id,
          menu1_id: currentAppointment.menu1_id,
          memo: existingMemo
        },
        after_data: {
          status: 'キャンセル',
          cancel_reason_id: cancelReasonId,
          cancelled_at: updatedAppointment.cancelled_at,
          memo: updatedMemo
        },
        reason: `予約をキャンセルしました${cancelReason ? ` (理由: ${cancelReason.name})` : ''}`,
        operator_id: cancelledBy || null
      })
    }

    return appointment
  }

  const client = getSupabaseClient()

  console.log('キャンセル対象の予約ID:', appointmentId)

  // 既存の予約データを取得してメモとステータスを確認
  const { data: currentData, error: fetchError } = await client
    .from('appointments')
    .select('memo, status')
    .eq('id', appointmentId)
    .maybeSingle()

  if (fetchError) {
    console.error('予約データ取得エラー:', fetchError)
    throw fetchError
  }

  if (!currentData) {
    console.error('予約が見つかりません。ID:', appointmentId)
    throw new Error('予約が見つかりませんでした')
  }

  const existingMemo = currentData?.memo || ''

  // 既存メモに追記（キャンセルメモがある場合のみ）
  let updatedMemo = existingMemo
  if (additionalMemo && additionalMemo.trim()) {
    updatedMemo = existingMemo
      ? `${existingMemo}\n\n[キャンセル時メモ]\n${additionalMemo}`
      : `[キャンセル時メモ]\n${additionalMemo}`
  }

  const { data, error } = await client
    .from('appointments')
    .update({
      status: 'キャンセル',
      cancel_reason_id: cancelReasonId,
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy || null,
      memo: updatedMemo,
      updated_at: new Date().toISOString()
    })
    .eq('id', appointmentId)
    .select(`
      *,
      patient:patients(*),
      menu1:treatment_menus!menu1_id(*),
      menu2:treatment_menus!menu2_id(*),
      menu3:treatment_menus!menu3_id(*),
      staff1:staff!staff1_id(*),
      staff2:staff!staff2_id(*),
      staff3:staff!staff3_id(*),
      cancel_reason:cancel_reasons!appointments_cancel_reason_id_fkey(*)
    `)
    .maybeSingle()

  if (error) {
    console.error('予約キャンセルエラー:', error)
    throw error
  }

  if (!data) {
    console.error('予約の更新に失敗しました。ID:', appointmentId)
    throw new Error('予約の更新に失敗しました')
  }

  // キャンセルログを記録
  if (currentData) {
    const { createAppointmentLog } = await import('./appointment-logs')
    const cancelReason = data.cancel_reason
    await createAppointmentLog({
      appointment_id: appointmentId,
      action: 'キャンセル',
      before_data: {
        status: currentData.status || '未来院',
        memo: existingMemo
      },
      after_data: {
        status: 'キャンセル',
        cancel_reason_id: cancelReasonId,
        cancelled_at: data.cancelled_at,
        memo: updatedMemo
      },
      reason: `予約をキャンセルしました${cancelReason ? ` (理由: ${cancelReason.name})` : ''}`,
      operator_id: cancelledBy || null
    })
  }

  return data
}

// ========================================
// 来院登録関連
// ========================================

/**
 * 予約を来院済みにする（QRコードスキャンなど）
 */
export async function checkInAppointment(
  appointmentId: string,
  method: 'qr_code' | 'manual' | 'auto' = 'manual'
): Promise<void> {
  const client = getSupabaseClient()
  await client
    .from('appointments')
    .update({
      checked_in_at: new Date().toISOString(),
      check_in_method: method
    })
    .eq('id', appointmentId)
}

/**
 * 来院済みかどうかを確認
 */
export async function isAppointmentCheckedIn(appointmentId: string): Promise<boolean> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('appointments')
    .select('checked_in_at')
    .eq('id', appointmentId)
    .single()

  if (error || !data) {
    return false
  }

  return !!data.checked_in_at
}

/**
 * 来院登録を取り消す
 */
export async function cancelCheckIn(appointmentId: string): Promise<void> {
  const client = getSupabaseClient()
  await client
    .from('appointments')
    .update({
      checked_in_at: null,
      check_in_method: null
    })
    .eq('id', appointmentId)
}

/**
 * 本日来院済みの予約一覧を取得
 */
export async function getTodayCheckedInAppointments(
  clinicId: string
): Promise<Appointment[]> {
  const client = getSupabaseClient()

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const { data, error } = await client
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .gte('start_time', todayStart.toISOString())
    .lt('start_time', todayEnd.toISOString())
    .not('checked_in_at', 'is', null)
    .order('checked_in_at', { ascending: false })

  if (error) {
    console.error('来院済み予約取得エラー:', error)
    throw new Error('来院済み予約の取得に失敗しました')
  }

  return data || []
}