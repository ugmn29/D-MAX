import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

// 広告媒体マスター一覧を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')

    const supabase = getSupabaseClient()

    // システム共通の媒体とクリニック固有の媒体を取得
    let query = supabase
      .from('ad_sources_master')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (clinic_id) {
      // クリニック固有 OR システム共通（clinic_id = NULL）
      query = query.or(`clinic_id.eq.${clinic_id},clinic_id.is.null`)
    } else {
      // システム共通のみ
      query = query.is('clinic_id', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('広告媒体取得エラー:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ad sources' },
        { status: 500 }
      )
    }

    // カテゴリ別にグループ化
    const categories = new Map<string, any[]>()
    data?.forEach((source) => {
      if (!categories.has(source.category)) {
        categories.set(source.category, [])
      }
      categories.get(source.category)!.push(source)
    })

    return NextResponse.json({
      success: true,
      data: {
        sources: data,
        by_category: Object.fromEntries(categories),
      },
    })
  } catch (error) {
    console.error('広告媒体API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 広告媒体を追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, name, category, utm_source, utm_medium, description } = body

    if (!clinic_id || !name || !category || !utm_source) {
      return NextResponse.json(
        { error: 'clinic_id, name, category, utm_source are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // 同じutm_sourceが既に存在するか確認
    const { data: existing } = await supabase
      .from('ad_sources_master')
      .select('id')
      .eq('clinic_id', clinic_id)
      .eq('utm_source', utm_source)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'utm_source already exists for this clinic' },
        { status: 409 }
      )
    }

    // 最大sort_orderを取得
    const { data: maxOrder } = await supabase
      .from('ad_sources_master')
      .select('sort_order')
      .or(`clinic_id.eq.${clinic_id},clinic_id.is.null`)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const newSortOrder = (maxOrder?.sort_order || 0) + 1

    const { data, error } = await supabase
      .from('ad_sources_master')
      .insert({
        clinic_id,
        name,
        category,
        utm_source,
        utm_medium: utm_medium || 'custom',
        description,
        is_system: false,
        sort_order: newSortOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('広告媒体追加エラー:', error)
      return NextResponse.json(
        { error: 'Failed to add ad source' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('広告媒体追加API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 広告媒体を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, category, utm_source, utm_medium, description, is_active } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // システム媒体は編集不可
    const { data: source } = await supabase
      .from('ad_sources_master')
      .select('is_system')
      .eq('id', id)
      .single()

    if (source?.is_system) {
      return NextResponse.json(
        { error: 'System ad sources cannot be modified' },
        { status: 403 }
      )
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (category !== undefined) updateData.category = category
    if (utm_source !== undefined) updateData.utm_source = utm_source
    if (utm_medium !== undefined) updateData.utm_medium = utm_medium
    if (description !== undefined) updateData.description = description
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('ad_sources_master')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('広告媒体更新エラー:', error)
      return NextResponse.json(
        { error: 'Failed to update ad source' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('広告媒体更新API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 広告媒体を削除
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

    // システム媒体は削除不可
    const { data: source } = await supabase
      .from('ad_sources_master')
      .select('is_system')
      .eq('id', id)
      .single()

    if (source?.is_system) {
      return NextResponse.json(
        { error: 'System ad sources cannot be deleted' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('ad_sources_master')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('広告媒体削除エラー:', error)
      return NextResponse.json(
        { error: 'Failed to delete ad source' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('広告媒体削除API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
