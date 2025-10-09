import { NextRequest, NextResponse } from 'next/server'
import { getAppointments, createAppointment, updateAppointment, deleteAppointment, updateAppointmentStatus } from '@/lib/api/appointments'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

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
    return NextResponse.json(appointment)
  } catch (error) {
    console.error('予約作成エラー:', error)
    return NextResponse.json({ error: '予約の作成に失敗しました' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, ...appointmentData } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 })
    }

    const appointment = await updateAppointment(appointmentId, appointmentData)
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

    await deleteAppointment(appointmentId)
    return NextResponse.json({ message: '予約を削除しました' })
  } catch (error) {
    console.error('予約削除エラー:', error)
    return NextResponse.json({ error: '予約の削除に失敗しました' }, { status: 500 })
  }
}
