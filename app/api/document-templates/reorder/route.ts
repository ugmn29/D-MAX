import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

// POST - テンプレートの並び順を一括更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templates } = body // [{ id, display_order }, ...]
    const supabase = getSupabaseClient()

    if (!Array.isArray(templates)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // トランザクション的に複数の更新を実行
    const updatePromises = templates.map(({ id, display_order }) =>
      supabase
        .from('document_templates')
        .update({ display_order })
        .eq('id', id)
    )

    const results = await Promise.all(updatePromises)

    // エラーチェック
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Error reordering templates:', errors)
      return NextResponse.json(
        { error: 'Failed to reorder some templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/document-templates/reorder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
