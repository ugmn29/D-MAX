import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      session_id,
      clinic_id,
      tab_id,
      tab_label,
      tab_position,
      page_url,
      utm_source,
      utm_medium,
      utm_campaign,
      device_type,
      os,
      browser,
    } = body

    // バリデーション
    if (!session_id || !clinic_id || !tab_id || !tab_label) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // タブクリックイベントを記録
    const { data: clickEvent, error: clickError } = await supabase
      .from('hp_tab_click_events')
      .insert({
        session_id,
        clinic_id,
        tab_id,
        tab_label,
        tab_position,
        page_url,
        utm_source,
        utm_medium,
        utm_campaign,
        device_type,
        os,
        browser,
        click_timestamp: new Date().toISOString(),
      })
      .select()
      .single()

    if (clickError) {
      console.error('タブクリックイベント記録エラー:', clickError)
      return NextResponse.json(
        { error: 'Failed to record tab click event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: clickEvent })
  } catch (error) {
    console.error('タブクリックAPI エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 予約完了時にタブクリックイベントを更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, did_complete_booking } = body

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // セッションIDに紐づくタブクリックイベントを更新
    const { data, error } = await supabase
      .from('hp_tab_click_events')
      .update({
        did_visit_booking: true,
        did_complete_booking: did_complete_booking || false,
        booking_completed_at: did_complete_booking ? new Date().toISOString() : null,
      })
      .eq('session_id', session_id)
      .order('click_timestamp', { ascending: false })
      .limit(1)
      .select()

    if (error) {
      console.error('タブクリックイベント更新エラー:', error)
      return NextResponse.json(
        { error: 'Failed to update tab click event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('タブクリック更新API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
