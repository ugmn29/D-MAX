import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'
const createClient = getSupabaseClient

/**
 * LINE予約管理API
 *
 * GET: LINE連携患者の予約一覧を取得
 * PATCH: 予約をキャンセル
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const line_user_id = searchParams.get('line_user_id')

    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // LINE連携患者を取得
    const { data: linkages, error: linkageError } = await supabase
      .from('line_patient_linkages')
      .select('patient_id, patients(id, last_name, first_name, patient_number)')
      .eq('line_user_id', line_user_id)

    if (linkageError) {
      console.error('連携情報取得エラー:', linkageError)
      return NextResponse.json(
        { error: '連携情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!linkages || linkages.length === 0) {
      return NextResponse.json({
        appointments: [],
        count: 0,
        message: 'LINE連携されている患者がいません'
      })
    }

    // 連携患者のIDリストを取得
    const patientIds = linkages.map(l => l.patient_id)

    // 予約を取得（今日以降の予約のみ）
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        appointment_date,
        appointment_time,
        duration,
        status,
        treatment_type,
        notes,
        cancellation_reason,
        cancelled_at,
        patients (
          id,
          patient_number,
          last_name,
          first_name
        ),
        staff:staff_id (
          id,
          last_name,
          first_name
        )
      `)
      .in('patient_id', patientIds)
      .gte('appointment_date', today.toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    if (appointmentError) {
      console.error('予約取得エラー:', appointmentError)
      return NextResponse.json(
        { error: '予約情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 予約データを整形
    const formattedAppointments = (appointments || []).map(apt => {
      const patient = apt.patients as any
      const staff = apt.staff as any

      return {
        id: apt.id,
        patient: {
          id: patient.id,
          name: `${patient.last_name} ${patient.first_name}`,
          patient_number: patient.patient_number
        },
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        duration: apt.duration,
        status: apt.status,
        treatment_type: apt.treatment_type,
        notes: apt.notes,
        staff: staff ? {
          id: staff.id,
          name: `${staff.last_name} ${staff.first_name}`
        } : null,
        cancellation_reason: apt.cancellation_reason,
        cancelled_at: apt.cancelled_at
      }
    })

    // 患者ごとにグループ化
    const appointmentsByPatient = linkages.map(linkage => {
      const patient = linkage.patients as any
      const patientAppointments = formattedAppointments.filter(
        apt => apt.patient.id === patient.id
      )

      return {
        patient: {
          id: patient.id,
          name: `${patient.last_name} ${patient.first_name}`,
          patient_number: patient.patient_number
        },
        appointments: patientAppointments,
        count: patientAppointments.length
      }
    })

    return NextResponse.json({
      appointments_by_patient: appointmentsByPatient,
      total_count: formattedAppointments.length,
      patient_count: linkages.length
    })

  } catch (error) {
    console.error('予約取得API エラー:', error)
    return NextResponse.json(
      { error: '予約情報の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { appointment_id, line_user_id, cancellation_reason } = await request.json()

    if (!appointment_id || !line_user_id) {
      return NextResponse.json(
        { error: '予約IDとLINE User IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 予約情報を取得
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, patient_id, appointment_date, appointment_time, status')
      .eq('id', appointment_id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: '予約が見つかりません' },
        { status: 404 }
      )
    }

    // 既にキャンセル済みか確認
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'この予約は既にキャンセルされています' },
        { status: 400 }
      )
    }

    // 過去の予約かチェック
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
    const now = new Date()

    if (appointmentDateTime < now) {
      return NextResponse.json(
        { error: '過去の予約はキャンセルできません' },
        { status: 400 }
      )
    }

    // LINE連携を確認（患者が連携されているか）
    const { data: linkage } = await supabase
      .from('line_patient_linkages')
      .select('id')
      .eq('line_user_id', line_user_id)
      .eq('patient_id', appointment.patient_id)
      .single()

    if (!linkage) {
      return NextResponse.json(
        { error: 'この予約をキャンセルする権限がありません' },
        { status: 403 }
      )
    }

    // 予約をキャンセル
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellation_reason || 'LINE経由でキャンセル',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointment_id)
      .select()
      .single()

    if (updateError) {
      console.error('予約キャンセルエラー:', updateError)
      return NextResponse.json(
        { error: '予約のキャンセルに失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        cancellation_reason: updatedAppointment.cancellation_reason,
        cancelled_at: updatedAppointment.cancelled_at
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
