import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { jsonToObject } from '@/lib/prisma-helpers'

/**
 * LINE予約管理API
 *
 * GET: LINE連携患者の予約一覧を取得（Web予約設定も含む）
 * PATCH: 予約をキャンセル（Web予約設定のチェック付き）
 */

// デモクリニックID（本番環境では動的に取得する）
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

/**
 * 患者のWeb予約設定を取得
 */
async function getPatientWebBookingSettings(patientId: string, clinicId: string) {
  const prisma = getPrismaClient()

  try {
    const data = await prisma.patient_web_booking_settings.findFirst({
      where: {
        patient_id: patientId,
        clinic_id: clinicId,
      }
    })
    return data
  } catch {
    // テーブルが存在しない場合やレコードがない場合はnullを返す
    return null
  }
}

/**
 * 患者のキャンセル履歴数を取得（過去30日間）
 */
async function getPatientCancelCount(patientId: string, clinicId: string): Promise<number> {
  const prisma = getPrismaClient()

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const count = await prisma.appointments.count({
      where: {
        patient_id: patientId,
        status: 'CANCELLED',
        cancelled_at: { gte: thirtyDaysAgo },
        memo: {
          not: null,
          contains: 'LINE経由キャンセル',
        }
      }
    })

    return count
  } catch (error) {
    console.error('キャンセル数取得エラー:', error)
    return 0
  }
}

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const { searchParams } = new URL(request.url)
    const line_user_id = searchParams.get('line_user_id')

    console.log('🔍 GET /api/line/appointments - 開始', { line_user_id })

    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDが必要です' },
        { status: 400 }
      )
    }

    // クリニック情報を取得（電話番号）- clinic_settingsテーブルのclinic_infoから取得
    let clinicPhone: string | null = null
    const clinicInfoSetting = await prisma.clinic_settings.findFirst({
      where: {
        clinic_id: DEMO_CLINIC_ID,
        setting_key: 'clinic_info',
      },
      select: { setting_value: true }
    })

    const clinicInfoValue = jsonToObject<any>(clinicInfoSetting?.setting_value)
    if (clinicInfoValue?.phone) {
      clinicPhone = clinicInfoValue.phone
    } else {
      // フォールバック: clinicsテーブルからも確認
      const clinic = await prisma.clinics.findUnique({
        where: { id: DEMO_CLINIC_ID },
        select: { phone: true }
      })
      clinicPhone = clinic?.phone || null
    }

    // LINE連携患者を取得
    console.log('📊 連携データ取得開始...')
    const linkages = await prisma.line_patient_linkages.findMany({
      where: { line_user_id }
    })

    console.log('📊 連携データ取得完了:', {
      count: linkages.length,
      linkages: linkages,
    })

    if (!linkages || linkages.length === 0) {
      return NextResponse.json({
        appointments_by_patient: [],
        total_count: 0,
        patient_count: 0,
        clinic_phone: clinicPhone,
        message: 'LINE連携されている患者がいません'
      })
    }

    // 各連携の患者情報を取得
    const linkagesWithPatients = await Promise.all(
      linkages.map(async (linkage) => {
        const patient = await prisma.patients.findUnique({
          where: { id: linkage.patient_id },
          select: { id: true, last_name: true, first_name: true, patient_number: true }
        })

        return {
          ...linkage,
          patients: patient
        }
      })
    )

    // 連携患者のIDリストを取得
    const patientIds = linkages.map(l => l.patient_id)

    // 予約を取得（今日以降の予約のみ）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    console.log('📅 予約取得開始:', { patientIds, date: todayStr })

    // まず全ての未来予約を取得（デバッグ用）
    const allFutureAppointments = await prisma.appointments.findMany({
      where: {
        appointment_date: { gte: today }
      },
      select: { id: true, patient_id: true, appointment_date: true },
      take: 20
    })

    console.log('📅 全未来予約:', allFutureAppointments.map(a => ({
      patient_id: a.patient_id,
      patient_id_type: typeof a.patient_id,
      date: a.appointment_date
    })))
    console.log('📅 連携患者ID:', patientIds.map(id => ({ id, type: typeof id })))

    const appointments = await prisma.appointments.findMany({
      where: {
        patient_id: { in: patientIds },
        appointment_date: { gte: today }
      },
      orderBy: [
        { appointment_date: 'asc' },
        { start_time: 'asc' }
      ]
    })

    console.log('📅 予約取得完了:', {
      count: appointments.length,
    })

    // スタッフ情報を取得（staff1_id を使用）
    const staffIds = [...new Set(appointments.map(a => a.staff1_id).filter(Boolean))] as string[]
    let staffMap: Record<string, any> = {}
    if (staffIds.length > 0) {
      const staffList = await prisma.staff.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, name: true }
      })

      staffMap = staffList.reduce((acc, s) => {
        acc[s.id] = s
        return acc
      }, {} as Record<string, any>)
    }

    // 予約データを整形
    const formattedAppointments = appointments.map(apt => {
      // 患者情報はlinkagesWithPatientsから取得
      const linkedPatient = linkagesWithPatients.find(l => l.patient_id === apt.patient_id)
      const patient = linkedPatient?.patients
      const staff = apt.staff1_id ? staffMap[apt.staff1_id] : null

      // start_timeとend_timeからdurationを計算（分）
      let duration = 30 // デフォルト
      if (apt.start_time && apt.end_time) {
        // Prisma returns Time fields as Date objects
        const startDate = new Date(apt.start_time)
        const endDate = new Date(apt.end_time)
        const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
        const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
        duration = endMinutes - startMinutes
      }

      // start_time を HH:MM 形式に変換
      const startTimeStr = apt.start_time
        ? `${String(new Date(apt.start_time).getHours()).padStart(2, '0')}:${String(new Date(apt.start_time).getMinutes()).padStart(2, '0')}`
        : null

      return {
        id: apt.id,
        patient: patient ? {
          id: patient.id,
          name: `${patient.last_name} ${patient.first_name}`,
          patient_number: patient.patient_number
        } : {
          id: apt.patient_id,
          name: '不明',
          patient_number: 0
        },
        appointment_date: apt.appointment_date ? apt.appointment_date.toISOString().split('T')[0] : null,
        appointment_time: startTimeStr, // start_timeを使用
        duration: duration,
        status: apt.status,
        treatment_type: apt.menu1_id || apt.menu2_id ? '診療予約' : null, // menu_idから推定
        notes: apt.memo,
        staff: staff ? {
          id: staff.id,
          name: staff.name
        } : null,
        cancellation_reason: apt.cancel_reason_id ? 'キャンセル' : null,
        cancelled_at: apt.cancelled_at?.toISOString() || null,
        // 予約変更用に元の診療メニューと担当者IDを保持
        menu1_id: apt.menu1_id || null,
        menu2_id: apt.menu2_id || null,
        staff_id: apt.staff1_id || null
      }
    })

    // 患者ごとにグループ化（Web予約設定も取得）
    const appointmentsByPatient = await Promise.all(
      linkagesWithPatients
        .filter(linkage => linkage.patients) // 患者情報がある連携のみ
        .map(async (linkage) => {
          const patient = linkage.patients as any
          const patientAppointments = formattedAppointments.filter(
            apt => apt.patient.id === patient.id
          )

          // 患者のWeb予約設定を取得
          const webBookingSettings = await getPatientWebBookingSettings(patient.id, DEMO_CLINIC_ID)
          const cancelCount = await getPatientCancelCount(patient.id, DEMO_CLINIC_ID)

          // キャンセル可否を判定
          let canCancel = true
          let canReschedule = true
          let cancelBlockReason: string | null = null
          let rescheduleBlockReason: string | null = null

          if (webBookingSettings) {
            // Webキャンセルが無効の場合
            if (!webBookingSettings.web_cancel_enabled) {
              canCancel = false
              cancelBlockReason = 'Webキャンセルが無効になっています'
            }
            // Web予約変更が無効の場合
            if (!webBookingSettings.web_reschedule_enabled) {
              canReschedule = false
              rescheduleBlockReason = 'Web予約変更が無効になっています'
            }
            // キャンセル回数制限を超えている場合
            if (webBookingSettings.web_cancel_limit && cancelCount >= webBookingSettings.web_cancel_limit) {
              canCancel = false
              canReschedule = false
              cancelBlockReason = `キャンセル回数上限（${webBookingSettings.web_cancel_limit}回/月）に達しています`
              rescheduleBlockReason = `キャンセル回数上限（${webBookingSettings.web_cancel_limit}回/月）に達しています`
            }
          }

          return {
            patient: {
              id: patient.id,
              name: `${patient.last_name} ${patient.first_name}`,
              patient_number: patient.patient_number
            },
            appointments: patientAppointments,
            count: patientAppointments.length,
            // Web予約設定
            web_booking_settings: {
              can_cancel: canCancel,
              can_reschedule: canReschedule,
              cancel_block_reason: cancelBlockReason,
              reschedule_block_reason: rescheduleBlockReason,
              cancel_count_this_month: cancelCount,
              cancel_limit: webBookingSettings?.web_cancel_limit || null,
              cancel_deadline_hours: webBookingSettings?.cancel_deadline_hours || null
            }
          }
        })
    )

    console.log('✅ 予約取得成功:', { patients: appointmentsByPatient.length, appointments: formattedAppointments.length })

    return NextResponse.json({
      appointments_by_patient: appointmentsByPatient,
      total_count: formattedAppointments.length,
      patient_count: linkagesWithPatients.length,
      clinic_id: DEMO_CLINIC_ID,
      clinic_phone: clinicPhone,
      // デバッグ情報
      debug: {
        linkage_patient_ids: patientIds,
        raw_appointments_count: appointments.length,
        linkages_with_patients: linkagesWithPatients.map(l => ({
          patient_id: l.patient_id,
          has_patient_info: !!l.patients
        })),
        // 全未来予約のpatient_id一覧（比較用）
        all_future_appointment_patient_ids: allFutureAppointments.map(a => a.patient_id),
        today_date: todayStr
      }
    })

  } catch (error) {
    console.error('予約取得API エラー:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      {
        error: '予約情報の取得中にエラーが発生しました',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const { appointment_id, line_user_id, cancellation_reason } = await request.json()

    if (!appointment_id || !line_user_id) {
      return NextResponse.json(
        { error: '予約IDとLINE User IDが必要です' },
        { status: 400 }
      )
    }

    // 予約情報を取得
    const appointment = await prisma.appointments.findUnique({
      where: { id: appointment_id },
      select: { id: true, patient_id: true, appointment_date: true, start_time: true, status: true, memo: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      )
    }

    // 既にキャンセル済みか確認
    if (appointment.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'この予約は既にキャンセルされています' },
        { status: 400 }
      )
    }

    // 過去の予約かチェック
    // Prisma returns Date for appointment_date and Time for start_time
    const appointmentDateStr = appointment.appointment_date.toISOString().split('T')[0]
    const startTimeDate = new Date(appointment.start_time)
    const startTimeStr = `${String(startTimeDate.getHours()).padStart(2, '0')}:${String(startTimeDate.getMinutes()).padStart(2, '0')}`
    const appointmentDateTime = new Date(`${appointmentDateStr}T${startTimeStr}`)
    const now = new Date()

    if (appointmentDateTime < now) {
      return NextResponse.json(
        { error: '過去の予約はキャンセルできません' },
        { status: 400 }
      )
    }

    // LINE連携を確認（患者が連携されているか）
    const linkage = await prisma.line_patient_linkages.findFirst({
      where: {
        line_user_id,
        patient_id: appointment.patient_id,
      },
      select: { id: true }
    })

    if (!linkage) {
      return NextResponse.json(
        { error: 'この予約をキャンセルする権限がありません' },
        { status: 403 }
      )
    }

    // 患者のWeb予約設定をチェック
    const webBookingSettings = await getPatientWebBookingSettings(appointment.patient_id, DEMO_CLINIC_ID)

    if (webBookingSettings) {
      // Webキャンセルが無効の場合
      if (!webBookingSettings.web_cancel_enabled) {
        return NextResponse.json(
          { error: 'この患者さんはWebキャンセルが無効になっています。お電話でご連絡ください。' },
          { status: 403 }
        )
      }

      // キャンセル回数制限をチェック
      if (webBookingSettings.web_cancel_limit) {
        const cancelCount = await getPatientCancelCount(appointment.patient_id, DEMO_CLINIC_ID)
        if (cancelCount >= webBookingSettings.web_cancel_limit) {
          return NextResponse.json(
            { error: `キャンセル回数の上限（${webBookingSettings.web_cancel_limit}回/月）に達しています。お電話でご連絡ください。` },
            { status: 403 }
          )
        }
      }

      // キャンセル期限をチェック
      if (webBookingSettings.cancel_deadline_hours) {
        const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        if (hoursUntilAppointment < webBookingSettings.cancel_deadline_hours) {
          return NextResponse.json(
            { error: `予約の${webBookingSettings.cancel_deadline_hours}時間前を過ぎているため、Webキャンセルできません。お電話でご連絡ください。` },
            { status: 403 }
          )
        }
      }
    }

    // 予約をキャンセル（memo にキャンセル理由を追記）
    const existingMemo = appointment.memo || ''
    const cancelNote = cancellation_reason
      ? `[LINE経由キャンセル] ${cancellation_reason}`
      : '[LINE経由キャンセル]'
    const newMemo = existingMemo ? `${existingMemo}\n${cancelNote}` : cancelNote

    const updatedAppointment = await prisma.appointments.update({
      where: { id: appointment_id },
      data: {
        status: 'CANCELLED',
        memo: newMemo,
        cancelled_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        cancelled_at: updatedAppointment.cancelled_at?.toISOString() || null
      },
      message: '予約をキャンセルしました'
    })

  } catch (error) {
    console.error('予約キャンセルAPI エラー:', error)
    return NextResponse.json(
      { error: 'キャンセル処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
