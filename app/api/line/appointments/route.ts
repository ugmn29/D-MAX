import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    console.log('🔍 GET /api/line/appointments - 開始', { line_user_id })

    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin

    if (!supabase) {
      console.error('❌ supabaseAdmin未初期化')
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      )
    }

    // LINE連携患者を取得（JOINなしで）
    console.log('📊 連携データ取得開始...')
    const { data: linkages, error: linkageError } = await supabase
      .from('line_patient_linkages')
      .select('*')
      .eq('line_user_id', line_user_id)

    console.log('📊 連携データ取得完了:', {
      count: linkages?.length || 0,
      linkages: linkages,
      error: linkageError?.message,
      errorCode: linkageError?.code
    })

    if (linkageError) {
      console.error('連携情報取得エラー:', linkageError)
      return NextResponse.json(
        { error: '連携情報の取得に失敗しました', details: linkageError.message, code: linkageError.code },
        { status: 500 }
      )
    }

    if (!linkages || linkages.length === 0) {
      return NextResponse.json({
        appointments_by_patient: [],
        total_count: 0,
        patient_count: 0,
        message: 'LINE連携されている患者がいません'
      })
    }

    // 各連携の患者情報を取得
    const linkagesWithPatients = await Promise.all(
      linkages.map(async (linkage) => {
        const { data: patient } = await supabase
          .from('patients')
          .select('id, last_name, first_name, patient_number')
          .eq('id', linkage.patient_id)
          .single()

        return {
          ...linkage,
          patients: patient
        }
      })
    )

    // 連携患者のIDリストを取得
    const patientIds = linkages.map(l => l.patient_id)

    // 予約を取得（今日以降の予約のみ）- JOINなしで
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log('📅 予約取得開始:', { patientIds, date: today.toISOString().split('T')[0] })

    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .in('patient_id', patientIds)
      .gte('appointment_date', today.toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    console.log('📅 予約取得完了:', {
      count: appointments?.length || 0,
      error: appointmentError?.message
    })

    if (appointmentError) {
      console.error('予約取得エラー:', appointmentError)
      return NextResponse.json(
        { error: '予約情報の取得に失敗しました', details: appointmentError.message },
        { status: 500 }
      )
    }

    // スタッフ情報を取得
    const staffIds = [...new Set((appointments || []).map(a => a.staff_id).filter(Boolean))]
    let staffMap: Record<string, any> = {}
    if (staffIds.length > 0) {
      const { data: staffList } = await supabase
        .from('staff')
        .select('id, last_name, first_name')
        .in('id', staffIds)

      staffMap = (staffList || []).reduce((acc, s) => {
        acc[s.id] = s
        return acc
      }, {} as Record<string, any>)
    }

    // 予約データを整形
    const formattedAppointments = (appointments || []).map(apt => {
      // 患者情報はlinkagesWithPatientsから取得
      const linkedPatient = linkagesWithPatients.find(l => l.patient_id === apt.patient_id)
      const patient = linkedPatient?.patients
      const staff = apt.staff_id ? staffMap[apt.staff_id] : null

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
    const appointmentsByPatient = linkagesWithPatients
      .filter(linkage => linkage.patients) // 患者情報がある連携のみ
      .map(linkage => {
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

    console.log('✅ 予約取得成功:', { patients: appointmentsByPatient.length, appointments: formattedAppointments.length })

    return NextResponse.json({
      appointments_by_patient: appointmentsByPatient,
      total_count: formattedAppointments.length,
      patient_count: linkagesWithPatients.length,
      // デバッグ情報
      debug: {
        linkage_patient_ids: patientIds,
        raw_appointments_count: appointments?.length || 0,
        linkages_with_patients: linkagesWithPatients.map(l => ({
          patient_id: l.patient_id,
          has_patient_info: !!l.patients
        }))
      }
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

    const supabase = supabaseAdmin

    if (!supabase) {
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      )
    }

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
