import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

// PUT - テンプレート更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('document_templates')
      .update({
        template_name: body.template_name,
        template_data: body.template_data,
        display_order: body.display_order
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/document-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - テンプレート論理削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = getSupabaseClient()

    // 論理削除（is_active を false に設定）
    const { data, error } = await supabase
      .from('document_templates')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in DELETE /api/document-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
