// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointment
} from '@/lib/api/appointments-prisma'
import {
  createAppointmentReminderNotification,
  createAppointmentChangeNotification,
  cancelAppointmentNotifications,
  handleAppointmentConfirmed,
  createAppointmentConfirmationNotification
} from '@/lib/api/appointment-notifications'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const appointmentId = searchParams.get('appointment_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    // 単一予約の取得
    if (appointmentId) {
      const appointment = await getAppointmentById(clinicId, appointmentId)
      if (!appointment) {
        return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
      }
      return NextResponse.json(appointment)
    }

    // 予約一覧の取得
    const appointments = await getAppointments(clinicId, startDate || undefined, endDate || undefined)
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('予約取得エラー:', error)
    return NextResponse.json({ error: '予約データの取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinicId, ...appointmentData } = body

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId is required' }, { status: 400 })
    }

    const appointment = await createAppointment(clinicId, appointmentData)

    // 予約リマインド通知をスケジュール
    if (appointment.patient_id && appointment.start_time) {
      try {
        await createAppointmentReminderNotification(
          appointment.id,
          appointment.patient_id,
          clinicId,
          appointment.start_time
        )
        console.log('予約リマインド通知をスケジュールしました')
      } catch (notificationError) {
        console.error('予約リマインド通知のスケジュールに失敗:', notificationError)
        // 通知エラーは予約作成の成功を妨げない
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('予約作成エラー:', error)
    return NextResponse.json({ error: '予約の作成に失敗しました' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, oldStartTime, action, cancel_reason_id, cancelled_by, additional_memo, ...appointmentData } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 })
    }

    // キャンセルアクションの処理
    if (action === 'cancel') {
      if (!cancel_reason_id) {
        return NextResponse.json({ error: 'cancel_reason_id is required for cancel action' }, { status: 400 })
      }

      const cancelledAppointment = await cancelAppointment(
        appointmentId,
        cancel_reason_id,
        cancelled_by || undefined,
        additional_memo || undefined
      )

      // 予約に紐づく通知をキャンセル
      try {
        await cancelAppointmentNotifications(appointmentId)
        console.log('予約に紐づく通知をキャンセルしました')
      } catch (notificationError) {
        console.error('通知キャンセルに失敗:', notificationError)
      }

      return NextResponse.json(cancelledAppointment)
    }

    // 通常の更新
    const appointment = await updateAppointment(appointmentId, appointmentData)

    // 日時が変更された場合は変更通知を送信
    if (oldStartTime && appointment.start_time && oldStartTime !== appointment.start_time) {
      try {
        // 古い通知をキャンセル
        await cancelAppointmentNotifications(appointmentId)

        // 予約変更通知を作成
        if (appointment.patient_id && appointment.clinic_id) {
          await createAppointmentChangeNotification(
            appointmentId,
            appointment.patient_id,
            appointment.clinic_id,
            oldStartTime,
            appointment.start_time
          )
          console.log('予約変更通知を作成しました')

          // 新しいリマインド通知をスケジュール
          await createAppointmentReminderNotification(
            appointmentId,
            appointment.patient_id,
            appointment.clinic_id,
            appointment.start_time
          )
          console.log('新しいリマインド通知をスケジュールしました')
        }
      } catch (notificationError) {
        console.error('予約変更通知の処理に失敗:', notificationError)
      }
    }

    // ステータスが確定に変更された場合
    if (appointmentData.status === 'confirmed' && appointment.patient_id && appointment.clinic_id) {
      try {
        await handleAppointmentConfirmed(appointment.patient_id, appointment.clinic_id)
        console.log('予約確定処理完了（自動リマインドをキャンセル）')

        // 予約確定通知を送信
        if (appointment.start_time) {
          await createAppointmentConfirmationNotification(
            appointmentId,
            appointment.patient_id,
            appointment.clinic_id,
            appointment.start_time
          )
          console.log('予約確定通知を作成しました')
        }
      } catch (notificationError) {
        console.error('予約確定通知の処理に失敗:', notificationError)
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('予約更新エラー:', error)
    return NextResponse.json({ error: '予約の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointmentId')

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 })
    }

    // 予約に紐づく通知をキャンセル
    try {
      await cancelAppointmentNotifications(appointmentId)
      console.log('予約に紐づく通知をキャンセルしました')
    } catch (notificationError) {
      console.error('通知キャンセルに失敗:', notificationError)
    }

    await deleteAppointment(appointmentId)
    return NextResponse.json({ message: '予約を削除しました' })
  } catch (error) {
    console.error('予約削除エラー:', error)
    return NextResponse.json({ error: '予約の削除に失敗しました' }, { status: 500 })
  }
}
