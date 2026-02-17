// Migrated to Prisma API Routes
import { getPrismaClient } from '@/lib/prisma-client'
import { AppointmentStatus } from '@/lib/prisma-helpers'
import type { Appointment, AppointmentInsert, AppointmentUpdate } from '@/types/database'

/**
 * 時間フィールドをHH:MM形式にフォーマット
 */
function formatTime(time: Date | null | undefined): string | null {
  if (!time) return null
  const timeStr = time.toISOString()
  // "1970-01-01T12:30:00.000Z" -> "12:30"
  return timeStr.substring(11, 16)
}

/**
 * 予約を取得（Prisma版）
 */
export async function getAppointments(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<Appointment[]> {
  const prisma = getPrismaClient()

  // WHERE条件を構築
  const where: any = {
    clinic_id: clinicId
  }

  if (startDate) {
    where.appointment_date = {
      ...where.appointment_date,
      gte: new Date(startDate)
    }
  }

  if (endDate) {
    where.appointment_date = {
      ...where.appointment_date,
      lte: new Date(endDate)
    }
  }

  // Prismaで予約を取得（リレーション含む）
  const appointments = await prisma.appointments.findMany({
    where,
    include: {
      patients: {
        select: {
          id: true,
          last_name: true,
          first_name: true,
          last_name_kana: true,
          first_name_kana: true,
          phone: true,
          birth_date: true,
          gender: true,
          is_registered: true,
          patient_number: true
        }
      },
      units: {
        select: {
          id: true,
          name: true
        }
      },
      treatment_menus_appointments_menu1_idTotreatment_menus: {
        select: {
          id: true,
          name: true,
          color: true,
          standard_duration: true
        }
      },
      treatment_menus_appointments_menu2_idTotreatment_menus: {
        select: {
          id: true,
          name: true,
          color: true,
          standard_duration: true
        }
      },
      treatment_menus_appointments_menu3_idTotreatment_menus: {
        select: {
          id: true,
          name: true,
          color: true,
          standard_duration: true
        }
      },
      staff_appointments_staff1_idTostaff: {
        select: {
          id: true,
          name: true
        }
      },
      staff_appointments_staff2_idTostaff: {
        select: {
          id: true,
          name: true
        }
      },
      staff_appointments_staff3_idTostaff: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      { appointment_date: 'asc' },
      { start_time: 'asc' }
    ]
  })

  // 患者アイコン情報を一括取得（Prisma直接クエリ）
  const patientIds = appointments
    .filter(apt => apt.patient_id)
    .map(apt => apt.patient_id!)
  const uniquePatientIds = [...new Set(patientIds)]

  let patientIconsMap: Map<string, string[]> = new Map()
  if (uniquePatientIds.length > 0) {
    try {
      const allIcons = await prisma.patient_icons.findMany({
        where: {
          clinic_id: clinicId,
          patient_id: { in: uniquePatientIds }
        },
        select: { patient_id: true, icon_ids: true }
      })
      allIcons.forEach(icon => {
        patientIconsMap.set(icon.patient_id, icon.icon_ids)
      })
    } catch (error) {
      console.error('患者アイコン一括取得エラー:', error)
    }
  }

  // データ変換：Prisma型 → アプリ型
  const result = appointments.map((apt) => {
    const patientWithIcons = apt.patients ? {
      ...apt.patients,
      birth_date: apt.patients.birth_date ? apt.patients.birth_date.toISOString().split('T')[0] : null,
      icon_ids: apt.patient_id ? (patientIconsMap.get(apt.patient_id) || []) : []
    } : null

    return {
      ...apt,
      // Date → ISO文字列
      appointment_date: apt.appointment_date.toISOString().split('T')[0], // YYYY-MM-DD
      start_time: formatTime(apt.start_time),
      end_time: formatTime(apt.end_time),
      created_at: apt.created_at?.toISOString() || null,
      updated_at: apt.updated_at?.toISOString() || null,
      cancelled_at: apt.cancelled_at?.toISOString() || null,
      checked_in_at: apt.checked_in_at?.toISOString() || null,

      // Enum → 文字列
      status: apt.status ? AppointmentStatus.toDb(apt.status) : null,

      // リレーション名を既存UIに合わせる
      patient: patientWithIcons,
      unit: apt.units,
      menu1: apt.treatment_menus_appointments_menu1_idTotreatment_menus,
      menu2: apt.treatment_menus_appointments_menu2_idTotreatment_menus,
      menu3: apt.treatment_menus_appointments_menu3_idTotreatment_menus,
      staff1: apt.staff_appointments_staff1_idTostaff,
      staff2: apt.staff_appointments_staff2_idTostaff,
      staff3: apt.staff_appointments_staff3_idTostaff,

      // Prismaのリレーションフィールドを削除
      patients: undefined,
      units: undefined,
      treatment_menus_appointments_menu1_idTotreatment_menus: undefined,
      treatment_menus_appointments_menu2_idTotreatment_menus: undefined,
      treatment_menus_appointments_menu3_idTotreatment_menus: undefined,
      staff_appointments_staff1_idTostaff: undefined,
      staff_appointments_staff2_idTostaff: undefined,
      staff_appointments_staff3_idTostaff: undefined
    } as any as Appointment
  })

  return result
}

/**
 * 特定日の予約を取得（Prisma版）
 */
export async function getAppointmentsByDate(
  clinicId: string,
  date: string
): Promise<Appointment[]> {
  return getAppointments(clinicId, date, date)
}

/**
 * 予約詳細を取得（Prisma版）
 */
export async function getAppointmentById(
  clinicId: string,
  appointmentId: string
): Promise<Appointment | null> {
  const prisma = getPrismaClient()

  const appointment = await prisma.appointments.findFirst({
    where: {
      id: appointmentId,
      clinic_id: clinicId
    },
    include: {
      patients: true,
      units: true,
      treatment_menus_appointments_menu1_idTotreatment_menus: true,
      treatment_menus_appointments_menu2_idTotreatment_menus: true,
      treatment_menus_appointments_menu3_idTotreatment_menus: true,
      staff_appointments_staff1_idTostaff: true,
      staff_appointments_staff2_idTostaff: true,
      staff_appointments_staff3_idTostaff: true
    }
  })

  if (!appointment) {
    return null
  }

  // 患者アイコン情報を取得
  let patientWithIcons = appointment.patients ? {
    ...appointment.patients,
    birth_date: appointment.patients.birth_date ? appointment.patients.birth_date.toISOString().split('T')[0] : null,
    icon_ids: [] as string[]
  } : null

  if (appointment.patient_id && patientWithIcons) {
    try {
      const patientIcons = await prisma.patient_icons.findUnique({
        where: {
          patient_id_clinic_id: {
            patient_id: appointment.patient_id,
            clinic_id: clinicId
          }
        },
        select: { icon_ids: true }
      })
      patientWithIcons.icon_ids = patientIcons?.icon_ids || []
    } catch (error) {
      console.error('患者アイコン取得エラー:', error)
    }
  }

  // データ変換
  return {
    ...appointment,
    appointment_date: appointment.appointment_date.toISOString().split('T')[0],
    start_time: formatTime(appointment.start_time),
    end_time: formatTime(appointment.end_time),
    created_at: appointment.created_at?.toISOString() || null,
    updated_at: appointment.updated_at?.toISOString() || null,
    cancelled_at: appointment.cancelled_at?.toISOString() || null,
    checked_in_at: appointment.checked_in_at?.toISOString() || null,
    status: appointment.status ? AppointmentStatus.toDb(appointment.status) : null,
    patient: patientWithIcons,
    unit: appointment.units,
    menu1: appointment.treatment_menus_appointments_menu1_idTotreatment_menus,
    menu2: appointment.treatment_menus_appointments_menu2_idTotreatment_menus,
    menu3: appointment.treatment_menus_appointments_menu3_idTotreatment_menus,
    staff1: appointment.staff_appointments_staff1_idTostaff,
    staff2: appointment.staff_appointments_staff2_idTostaff,
    staff3: appointment.staff_appointments_staff3_idTostaff,
    patients: undefined,
    units: undefined,
    treatment_menus_appointments_menu1_idTotreatment_menus: undefined,
    treatment_menus_appointments_menu2_idTotreatment_menus: undefined,
    treatment_menus_appointments_menu3_idTotreatment_menus: undefined,
    staff_appointments_staff1_idTostaff: undefined,
    staff_appointments_staff2_idTostaff: undefined,
    staff_appointments_staff3_idTostaff: undefined
  } as any as Appointment
}

/**
 * 予約を作成（Prisma版）
 */
export async function createAppointment(
  clinicId: string,
  appointmentData: AppointmentInsert
): Promise<Appointment> {
  const prisma = getPrismaClient()

  const appointment = await prisma.appointments.create({
    data: {
      clinic_id: clinicId,
      patient_id: appointmentData.patient_id,
      appointment_date: new Date(appointmentData.appointment_date),
      start_time: new Date(`1970-01-01T${appointmentData.start_time}:00Z`),
      end_time: new Date(`1970-01-01T${appointmentData.end_time}:00Z`),
      unit_id: appointmentData.unit_id || null,
      menu1_id: appointmentData.menu1_id || null,
      menu2_id: appointmentData.menu2_id || null,
      menu3_id: appointmentData.menu3_id || null,
      staff1_id: appointmentData.staff1_id || null,
      staff2_id: appointmentData.staff2_id || null,
      staff3_id: appointmentData.staff3_id || null,
      status: appointmentData.status ? AppointmentStatus.fromDb(appointmentData.status) : 'NOT_YET_ARRIVED',
      memo: appointmentData.memo || null,
      created_by: appointmentData.created_by || null,
      is_block: appointmentData.is_block || false,
      block_color: appointmentData.block_color || null,
      block_text: appointmentData.block_text || null
    }
  })

  return {
    ...appointment,
    appointment_date: appointment.appointment_date.toISOString().split('T')[0],
    start_time: formatTime(appointment.start_time),
    end_time: formatTime(appointment.end_time),
    created_at: appointment.created_at?.toISOString() || null,
    updated_at: appointment.updated_at?.toISOString() || null,
    cancelled_at: appointment.cancelled_at?.toISOString() || null,
    checked_in_at: appointment.checked_in_at?.toISOString() || null,
    status: appointment.status ? AppointmentStatus.toDb(appointment.status) : null
  } as any as Appointment
}

/**
 * 予約を更新（Prisma版）
 */
export async function updateAppointment(
  appointmentId: string,
  appointmentData: AppointmentUpdate
): Promise<Appointment> {
  const prisma = getPrismaClient()

  const updateData: any = {
    updated_at: new Date()
  }

  if (appointmentData.patient_id !== undefined) updateData.patient_id = appointmentData.patient_id
  if (appointmentData.appointment_date !== undefined) {
    updateData.appointment_date = new Date(appointmentData.appointment_date)
  }
  if (appointmentData.start_time !== undefined) {
    updateData.start_time = new Date(`1970-01-01T${appointmentData.start_time}:00Z`)
  }
  if (appointmentData.end_time !== undefined) {
    updateData.end_time = new Date(`1970-01-01T${appointmentData.end_time}:00Z`)
  }
  if (appointmentData.unit_id !== undefined) updateData.unit_id = appointmentData.unit_id || null
  if (appointmentData.menu1_id !== undefined) updateData.menu1_id = appointmentData.menu1_id || null
  if (appointmentData.menu2_id !== undefined) updateData.menu2_id = appointmentData.menu2_id || null
  if (appointmentData.menu3_id !== undefined) updateData.menu3_id = appointmentData.menu3_id || null
  if (appointmentData.staff1_id !== undefined) updateData.staff1_id = appointmentData.staff1_id || null
  if (appointmentData.staff2_id !== undefined) updateData.staff2_id = appointmentData.staff2_id || null
  if (appointmentData.staff3_id !== undefined) updateData.staff3_id = appointmentData.staff3_id || null
  if (appointmentData.status !== undefined) {
    updateData.status = AppointmentStatus.fromDb(appointmentData.status)
  }
  if (appointmentData.memo !== undefined) updateData.memo = appointmentData.memo || null
  if (appointmentData.is_block !== undefined) updateData.is_block = appointmentData.is_block
  if (appointmentData.block_color !== undefined) updateData.block_color = appointmentData.block_color || null
  if (appointmentData.block_text !== undefined) updateData.block_text = appointmentData.block_text || null

  const appointment = await prisma.appointments.update({
    where: { id: appointmentId },
    data: updateData,
    include: {
      patients: true
    }
  })

  return {
    ...appointment,
    appointment_date: appointment.appointment_date.toISOString().split('T')[0],
    start_time: formatTime(appointment.start_time),
    end_time: formatTime(appointment.end_time),
    created_at: appointment.created_at?.toISOString() || null,
    updated_at: appointment.updated_at?.toISOString() || null,
    cancelled_at: appointment.cancelled_at?.toISOString() || null,
    checked_in_at: appointment.checked_in_at?.toISOString() || null,
    status: appointment.status ? AppointmentStatus.toDb(appointment.status) : null,
    patient: appointment.patients as any,
    patients: undefined
  } as any as Appointment
}

/**
 * 予約ステータスを更新（Prisma版）
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: string
): Promise<void> {
  const prisma = getPrismaClient()

  await prisma.appointments.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.fromDb(status),
      updated_at: new Date()
    }
  })
}

/**
 * 予約を削除（Prisma版）
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  const prisma = getPrismaClient()

  await prisma.appointments.delete({
    where: { id: appointmentId }
  })
}

/**
 * 予約をキャンセル（Prisma版）
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelReasonId: string,
  cancelledBy?: string,
  additionalMemo?: string
): Promise<Appointment> {
  const prisma = getPrismaClient()

  // 既存の予約データを取得してメモを確認
  const currentAppointment = await prisma.appointments.findUnique({
    where: { id: appointmentId },
    select: { memo: true, status: true }
  })

  if (!currentAppointment) {
    throw new Error('予約が見つかりませんでした')
  }

  const existingMemo = currentAppointment.memo || ''

  // 既存メモに追記（キャンセルメモがある場合のみ）
  let updatedMemo = existingMemo
  if (additionalMemo && additionalMemo.trim()) {
    updatedMemo = existingMemo
      ? `${existingMemo}\n\n[キャンセル時メモ]\n${additionalMemo}`
      : `[キャンセル時メモ]\n${additionalMemo}`
  }

  const appointment = await prisma.appointments.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancel_reason_id: cancelReasonId,
      cancelled_at: new Date(),
      cancelled_by: cancelledBy || null,
      memo: updatedMemo,
      updated_at: new Date()
    },
    include: {
      patients: true,
      treatment_menus_appointments_menu1_idTotreatment_menus: true,
      treatment_menus_appointments_menu2_idTotreatment_menus: true,
      treatment_menus_appointments_menu3_idTotreatment_menus: true,
      staff_appointments_staff1_idTostaff: true,
      staff_appointments_staff2_idTostaff: true,
      staff_appointments_staff3_idTostaff: true,
      cancel_reasons: true
    }
  })

  // キャンセルログを記録
  try {
    const { createAppointmentLog } = await import('./appointment-logs')
    const cancelReason = appointment.cancel_reasons
    await createAppointmentLog({
      appointment_id: appointmentId,
      action: 'キャンセル',
      before_data: {
        status: currentAppointment.status ? AppointmentStatus.toDb(currentAppointment.status) : '未来院',
        memo: existingMemo
      },
      after_data: {
        status: 'キャンセル',
        cancel_reason_id: cancelReasonId,
        cancelled_at: appointment.cancelled_at?.toISOString(),
        memo: updatedMemo
      },
      reason: `予約をキャンセルしました${cancelReason ? ` (理由: ${cancelReason.name})` : ''}`,
      operator_id: cancelledBy || null
    })
  } catch (logError) {
    console.error('キャンセルログ記録エラー:', logError)
  }

  return {
    ...appointment,
    appointment_date: appointment.appointment_date.toISOString().split('T')[0],
    start_time: formatTime(appointment.start_time),
    end_time: formatTime(appointment.end_time),
    created_at: appointment.created_at?.toISOString() || null,
    updated_at: appointment.updated_at?.toISOString() || null,
    cancelled_at: appointment.cancelled_at?.toISOString() || null,
    checked_in_at: appointment.checked_in_at?.toISOString() || null,
    status: appointment.status ? AppointmentStatus.toDb(appointment.status) : null,
    patient: appointment.patients as any,
    menu1: appointment.treatment_menus_appointments_menu1_idTotreatment_menus,
    menu2: appointment.treatment_menus_appointments_menu2_idTotreatment_menus,
    menu3: appointment.treatment_menus_appointments_menu3_idTotreatment_menus,
    staff1: appointment.staff_appointments_staff1_idTostaff,
    staff2: appointment.staff_appointments_staff2_idTostaff,
    staff3: appointment.staff_appointments_staff3_idTostaff,
    cancel_reason: appointment.cancel_reasons,
    patients: undefined,
    treatment_menus_appointments_menu1_idTotreatment_menus: undefined,
    treatment_menus_appointments_menu2_idTotreatment_menus: undefined,
    treatment_menus_appointments_menu3_idTotreatment_menus: undefined,
    staff_appointments_staff1_idTostaff: undefined,
    staff_appointments_staff2_idTostaff: undefined,
    staff_appointments_staff3_idTostaff: undefined,
    cancel_reasons: undefined
  } as any as Appointment
}

/**
 * 予約統計を取得（Prisma版）
 */
export async function getAppointmentStats(clinicId: string, date?: string) {
  const prisma = getPrismaClient()

  const where: any = {
    clinic_id: clinicId
  }

  if (date) {
    where.appointment_date = new Date(date)
  }

  const appointments = await prisma.appointments.findMany({
    where,
    select: { status: true }
  })

  const total = appointments.length
  const completed = appointments.filter(a => a.status === 'COMPLETED').length
  const inProgress = appointments.filter(a =>
    ['CHECKED_IN', 'IN_TREATMENT', 'PAYMENT'].includes(a.status || '')
  ).length
  const waiting = appointments.filter(a => a.status === 'NOT_YET_ARRIVED').length
  const cancelled = appointments.filter(a => a.status === 'CANCELLED').length

  return {
    total,
    completed,
    inProgress,
    waiting,
    cancelled
  }
}

/**
 * 予約を来院済みにする（Prisma版）
 */
export async function checkInAppointment(
  appointmentId: string,
  method: 'qr_code' | 'manual' | 'auto' = 'manual'
): Promise<void> {
  const prisma = getPrismaClient()

  await prisma.appointments.update({
    where: { id: appointmentId },
    data: {
      checked_in_at: new Date(),
      check_in_method: method,
      updated_at: new Date()
    }
  })
}

/**
 * 来院済みかどうかを確認（Prisma版）
 */
export async function isAppointmentCheckedIn(appointmentId: string): Promise<{ checked_in_at: string | null }> {
  const prisma = getPrismaClient()

  const appointment = await prisma.appointments.findUnique({
    where: { id: appointmentId },
    select: { checked_in_at: true }
  })

  return {
    checked_in_at: appointment?.checked_in_at?.toISOString() || null
  }
}

/**
 * 来院登録を取り消す（Prisma版）
 */
export async function cancelCheckIn(appointmentId: string): Promise<void> {
  const prisma = getPrismaClient()

  await prisma.appointments.update({
    where: { id: appointmentId },
    data: {
      checked_in_at: null,
      check_in_method: null,
      updated_at: new Date()
    }
  })
}

/**
 * 本日来院済みの予約一覧を取得（Prisma版）
 */
export async function getTodayCheckedInAppointments(
  clinicId: string,
  date: string
): Promise<Appointment[]> {
  const prisma = getPrismaClient()

  const appointments = await prisma.appointments.findMany({
    where: {
      clinic_id: clinicId,
      appointment_date: new Date(date),
      checked_in_at: { not: null }
    },
    orderBy: {
      checked_in_at: 'desc'
    }
  })

  return appointments.map(apt => ({
    ...apt,
    appointment_date: apt.appointment_date.toISOString().split('T')[0],
    start_time: formatTime(apt.start_time),
    end_time: formatTime(apt.end_time),
    created_at: apt.created_at?.toISOString() || null,
    updated_at: apt.updated_at?.toISOString() || null,
    cancelled_at: apt.cancelled_at?.toISOString() || null,
    checked_in_at: apt.checked_in_at?.toISOString() || null,
    status: apt.status ? AppointmentStatus.toDb(apt.status) : null
  })) as any as Appointment[]
}
