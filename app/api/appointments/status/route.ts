import { NextRequest, NextResponse } from 'next/server'
import { updateAppointmentStatus } from '@/lib/api/appointments'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinicId, appointmentId, status } = body

    if (!clinicId || !appointmentId || !status) {
      return NextResponse.json({ error: 'clinicId, appointmentId, and status are required' }, { status: 400 })
    }

    await updateAppointmentStatus(clinicId, appointmentId, status)
    return NextResponse.json({ message: '予約ステータスを更新しました' })
  } catch (error) {
    console.error('予約ステータス更新エラー:', error)
    return NextResponse.json({ error: '予約ステータスの更新に失敗しました' }, { status: 500 })
  }
}
