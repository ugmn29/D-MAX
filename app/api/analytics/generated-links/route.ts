import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET: リンク生成履歴を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const linkType = searchParams.get('link_type') // qr_code, sns_link, hp_embed
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let query = supabase
      .from('generated_links_history')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (linkType) {
      query = query.eq('link_type', linkType)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get generated links error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: 新しいリンクを保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      link_type,
      generated_url,
      destination_url,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      platform,
      placement,
      label,
      qr_code_url,
      created_by,
    } = body

    if (!clinic_id || !link_type || !generated_url) {
      return NextResponse.json(
        { error: 'clinic_id, link_type, generated_url are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('generated_links_history')
      .insert({
        clinic_id,
        link_type,
        generated_url,
        destination_url: destination_url || generated_url,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        platform,
        placement,
        label,
        qr_code_url,
        created_by,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Save generated link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: リンクを削除
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

    const { error } = await supabase
      .from('generated_links_history')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete generated link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
