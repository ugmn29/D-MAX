import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

// GET - テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const documentType = searchParams.get('documentType')
    const supabase = getSupabaseClient()

    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/document-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 新規テンプレート作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('document_templates')
      .insert({
        document_type: body.document_type,
        template_key: body.template_key,
        template_name: body.template_name,
        template_data: body.template_data,
        display_order: body.display_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/document-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
