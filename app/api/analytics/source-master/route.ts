import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET: 流入元マスタを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('acquisition_source_master')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // カテゴリ別にグループ化
    const grouped = {
      online: data?.filter(s => s.category === 'online') || [],
      offline: data?.filter(s => s.category === 'offline') || [],
      referral: data?.filter(s => s.category === 'referral') || [],
    }

    return NextResponse.json({ data, grouped })
  } catch (error) {
    console.error('Get acquisition sources error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 新しい流入元を追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      normalized_name,
      display_name,
      category,
      utm_source_patterns,
      questionnaire_patterns,
      sort_order,
    } = body

    if (!clinic_id || !normalized_name || !display_name || !category) {
      return NextResponse.json(
        { error: 'clinic_id, normalized_name, display_name, category are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('acquisition_source_master')
      .insert({
        clinic_id,
        normalized_name,
        display_name,
        category,
        utm_source_patterns: utm_source_patterns || [],
        questionnaire_patterns: questionnaire_patterns || [],
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Add acquisition source error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 流入元を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      normalized_name,
      display_name,
      category,
      utm_source_patterns,
      questionnaire_patterns,
      sort_order,
      is_active,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (normalized_name !== undefined) updateData.normalized_name = normalized_name
    if (display_name !== undefined) updateData.display_name = display_name
    if (category !== undefined) updateData.category = category
    if (utm_source_patterns !== undefined) updateData.utm_source_patterns = utm_source_patterns
    if (questionnaire_patterns !== undefined) updateData.questionnaire_patterns = questionnaire_patterns
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('acquisition_source_master')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Update acquisition source error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 流入元を削除（論理削除）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 論理削除
    const { error } = await supabase
      .from('acquisition_source_master')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete acquisition source error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
