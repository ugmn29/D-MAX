import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_DOCUMENT_TEMPLATES } from '@/lib/data/default-document-templates'

// デフォルトテンプレートを初期化
async function initializeDefaultTemplates(supabase: ReturnType<typeof getSupabaseClient>) {
  console.log('Initializing default document templates...')

  const insertData = DEFAULT_DOCUMENT_TEMPLATES.map(template => ({
    document_type: template.document_type,
    template_key: template.template_key,
    template_name: template.template_name,
    template_data: template.template_data,
    display_order: template.display_order,
    is_active: true
  }))

  const { error } = await supabase
    .from('document_templates')
    .insert(insertData)

  if (error) {
    console.error('Error initializing default templates:', error)
    return false
  }

  console.log(`✓ Initialized ${insertData.length} default document templates`)
  return true
}

// GET - テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const documentType = searchParams.get('documentType')
    const supabase = getSupabaseClient()

    // まず全件数をチェック（初期化が必要かどうか）
    const { count: totalCount } = await supabase
      .from('document_templates')
      .select('*', { count: 'exact', head: true })

    // テーブルが空の場合、デフォルトテンプレートを初期化
    if (totalCount === 0) {
      await initializeDefaultTemplates(supabase)
    }

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
