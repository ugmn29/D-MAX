import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

// GET: 広告費記録を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    let query = supabase
      .from('ad_spend_records')
      .select('*')
      .eq('clinic_id', clinic_id)
      .order('spend_date', { ascending: false })

    if (start_date) {
      query = query.gte('spend_date', start_date)
    }
    if (end_date) {
      query = query.lte('spend_date', end_date)
    }

    const { data, error } = await query

    if (error) {
      console.error('広告費データ取得エラー:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ad spend records' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('広告費取得APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 広告費記録を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      ad_platform,
      campaign_name,
      spend_date,
      amount,
      currency,
      notes
    } = body

    if (!clinic_id || !ad_platform || !spend_date || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('ad_spend_records')
      .insert({
        clinic_id,
        ad_platform,
        campaign_name: campaign_name || null,
        spend_date,
        amount,
        currency: currency || 'JPY',
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('広告費作成エラー:', error)
      return NextResponse.json(
        { error: 'Failed to create ad spend record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('広告費作成APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 広告費記録を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      ad_platform,
      campaign_name,
      spend_date,
      amount,
      currency,
      notes
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('ad_spend_records')
      .update({
        ad_platform,
        campaign_name,
        spend_date,
        amount,
        currency,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('広告費更新エラー:', error)
      return NextResponse.json(
        { error: 'Failed to update ad spend record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('広告費更新APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 広告費記録を削除
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('ad_spend_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('広告費削除エラー:', error)
      return NextResponse.json(
        { error: 'Failed to delete ad spend record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('広告費削除APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
