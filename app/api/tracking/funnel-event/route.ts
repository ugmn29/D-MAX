import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      session_id,
      clinic_id,
      step_name,
      step_number,
      event_type,
      utm_source,
      utm_medium,
      utm_campaign,
      device_type,
      metadata,
    } = body

    // 必須フィールドの検証
    if (!session_id || !clinic_id || !step_name || !step_number || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const supabase = supabaseAdmin

    // ファネルイベントを記録
    const { data, error } = await supabase
      .from('web_booking_funnel_events')
      .insert({
        session_id,
        clinic_id,
        step_name,
        step_number,
        event_type,
        utm_source,
        utm_medium,
        utm_campaign,
        device_type,
        metadata,
      })
      .select()
      .single()

    if (error) {
      console.error('ファネルイベント記録エラー:', error)
      return NextResponse.json(
        { error: 'Failed to record funnel event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('ファネルイベントAPI エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
