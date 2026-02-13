import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, AppointmentStatus } from '@/lib/prisma-helpers'
import { MOCK_MODE } from '@/lib/utils/mock-mode'
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
  // モックモードの場合は空配列を返す（MOCK_MODEは別途対応）
  if (MOCK_MODE) {
    return []
  }

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

  // 患者アイコン情報を取得
  const { getPatientIcons } = await import('@/lib/api/patient-icons')

  // データ変換：Prisma型 → アプリ型
  const appointmentsWithIcons = await Promise.all(
    appointments.map(async (apt) => {
      // 患者アイコン情報を取得
      let patientWithIcons = apt.patients ? {
        ...apt.patients,
        birth_date: apt.patients.birth_date ? apt.patients.birth_date.toISOString() : null,
        icon_ids: [] as string[]
      } : null

      if (apt.patient_id && patientWithIcons) {
        try {
          const patientIconsData = await getPatientIcons(apt.patient_id, clinicId)
          patientWithIcons.icon_ids = patientIconsData?.icon_ids || []
        } catch (error) {
          console.error('患者アイコン取得エラー', { patientId: apt.patient_id, error })
        }
      }

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
  )

  return appointmentsWithIcons
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
  if (MOCK_MODE) {
    return null
  }

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
    patient: appointment.patients as any,
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
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
    
  }

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
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
    
  }

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
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
    
  }

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
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
    
  }

  const prisma = getPrismaClient()

  await prisma.appointments.delete({
    where: { id: appointmentId }
  })
}
