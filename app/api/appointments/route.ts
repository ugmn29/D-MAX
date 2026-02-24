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
import { verifyAuth } from '@/lib/auth/verify-request'
import { writeAuditLog } from '@/lib/audit-log'

export async function GET(request: NextRequest) {
  // 認証確認
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointment_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // clinic_id はトークンから強制
    const clinicId = user.clinicId

    // 単一予約の取得
    if (appointmentId) {
      const appointment = await getAppointmentById(clinicId, appointmentId)
      if (!appointment) {
        return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
      }
      await writeAuditLog({
        clinicId,
        operatorId: user.staffId,
        actionType: 'READ',
        targetTable: 'appointments',
        targetRecordId: appointmentId,
      })
      return NextResponse.json(appointment)
    }

    // 予約一覧の取得
    const appointments = await getAppointments(clinicId, startDate || undefined, endDate || undefined)
    await writeAuditLog({
      clinicId,
      operatorId: user.staffId,
      actionType: 'READ',
      targetTable: 'appointments',
    })
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('[予約API] 取得エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}

// POST: 予約作成（Web予約から公開）
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
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('[予約API] 作成エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}

// PUT: 予約更新（認証必須）
export async function PUT(request: NextRequest) {
  // 認証確認
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { appointmentId, oldStartTime, action, cancel_reason_id, cancelled_by, additional_memo, ...appointmentData } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 })
    }

    // 予約の所有権確認
    const existing = await getAppointmentById(user.clinicId, appointmentId)
    if (!existing) {
      return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
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

      try {
        await cancelAppointmentNotifications(appointmentId)
        console.log('予約に紐づく通知をキャンセルしました')
      } catch (notificationError) {
        console.error('通知キャンセルに失敗:', notificationError)
      }

      await writeAuditLog({
        clinicId: user.clinicId,
        operatorId: user.staffId,
        actionType: 'UPDATE',
        targetTable: 'appointments',
        targetRecordId: appointmentId,
        beforeData: { status: existing.status, start_time: existing.start_time },
        afterData: { status: 'cancelled', cancel_reason_id },
      })

      return NextResponse.json(cancelledAppointment)
    }

    // 通常の更新
    const appointment = await updateAppointment(appointmentId, appointmentData)

    // 日時が変更された場合は変更通知を送信
    if (oldStartTime && appointment.start_time && oldStartTime !== appointment.start_time) {
      try {
        await cancelAppointmentNotifications(appointmentId)

        if (appointment.patient_id && appointment.clinic_id) {
          await createAppointmentChangeNotification(
            appointmentId,
            appointment.patient_id,
            appointment.clinic_id,
            oldStartTime,
            appointment.start_time
          )
          console.log('予約変更通知を作成しました')

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

    await writeAuditLog({
      clinicId: user.clinicId,
      operatorId: user.staffId,
      actionType: 'UPDATE',
      targetTable: 'appointments',
      targetRecordId: appointmentId,
      beforeData: { status: existing.status, start_time: existing.start_time },
      afterData: { status: appointment.status, start_time: appointment.start_time },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('[予約API] 更新エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}

// DELETE: 予約削除（認証必須）
export async function DELETE(request: NextRequest) {
  // 認証確認
  let user
  try {
    user = await verifyAuth(request)
  } catch {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointmentId')

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 })
    }

    // 削除前に所有権を確認（監査ログ用）
    const existing = await getAppointmentById(user.clinicId, appointmentId)
    if (!existing) {
      return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
    }

    // 予約に紐づく通知をキャンセル
    try {
      await cancelAppointmentNotifications(appointmentId)
      console.log('予約に紐づく通知をキャンセルしました')
    } catch (notificationError) {
      console.error('通知キャンセルに失敗:', notificationError)
    }

    await deleteAppointment(appointmentId)

    await writeAuditLog({
      clinicId: user.clinicId,
      operatorId: user.staffId,
      actionType: 'DELETE',
      targetTable: 'appointments',
      targetRecordId: appointmentId,
      beforeData: { status: existing.status, start_time: existing.start_time, patient_id: existing.patient_id },
    })

    return NextResponse.json({ message: '予約を削除しました' })
  } catch (error) {
    console.error('[予約API] 削除エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}
