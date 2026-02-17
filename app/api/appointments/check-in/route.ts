// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import {
  checkInAppointment,
  cancelCheckIn,
  isAppointmentCheckedIn,
  getTodayCheckedInAppointments
} from '@/lib/api/appointments-prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointment_id')
    const clinicId = searchParams.get('clinic_id')
    const date = searchParams.get('date')
    const checkedInOnly = searchParams.get('checked_in_only')

    // 本日来院済み予約一覧の取得
    if (clinicId && date && checkedInOnly === 'true') {
      const appointments = await getTodayCheckedInAppointments(clinicId, date)
      return NextResponse.json(appointments)
    }

    // 単一予約の来院状態確認
    if (appointmentId) {
      const result = await isAppointmentCheckedIn(appointmentId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'appointment_id or (clinic_id, date, checked_in_only) is required' }, { status: 400 })
  } catch (error) {
    console.error('来院確認エラー:', error)
    return NextResponse.json({ error: '来院確認に失敗しました' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, action, check_in_method } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 })
    }

    if (action === 'check_in') {
      await checkInAppointment(appointmentId, check_in_method || 'manual')
      return NextResponse.json({ message: '来院登録しました' })
    }

    if (action === 'cancel_check_in') {
      await cancelCheckIn(appointmentId)
      return NextResponse.json({ message: '来院登録を取り消しました' })
    }

    return NextResponse.json({ error: 'Invalid action. Use "check_in" or "cancel_check_in"' }, { status: 400 })
  } catch (error) {
    console.error('来院登録エラー:', error)
    return NextResponse.json({ error: '来院登録に失敗しました' }, { status: 500 })
  }
}
