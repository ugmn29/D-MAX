import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase-client'

// PUT /api/training/issues/[id]
// 課題を解決済みにする、または更新する
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { is_resolved, severity, notes } = body

    const updateData: any = {}

    if (is_resolved !== undefined) {
      updateData.is_resolved = is_resolved
      if (is_resolved) {
        updateData.resolved_at = new Date().toISOString()
      } else {
        updateData.resolved_at = null
      }
    }

    if (severity !== undefined) {
      updateData.severity = severity
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data, error } = await supabase
      .from('patient_issue_records')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        issue:patient_issues(*)
      `)
      .single()

    if (error) {
      console.error('課題更新エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('課題更新エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/training/issues/[id]
// 課題を削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await supabase
      .from('patient_issue_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('課題削除エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '課題を削除しました',
    })
  } catch (error: any) {
    console.error('課題削除エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
