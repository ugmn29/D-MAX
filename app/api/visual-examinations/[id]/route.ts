import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

// GET - 特定の視診検査を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseClient()

    const { data: exam, error: examError } = await supabase
      .from('visual_examinations')
      .select('*')
      .eq('id', id)
      .single()

    if (examError) {
      console.error('Error fetching visual examination:', examError)
      return NextResponse.json({ error: examError.message }, { status: 500 })
    }

    const { data: toothData, error: toothError } = await supabase
      .from('visual_tooth_data')
      .select('*')
      .eq('examination_id', id)
      .order('tooth_number')

    if (toothError) {
      console.error('Error fetching tooth data:', toothError)
      return NextResponse.json({ error: toothError.message }, { status: 500 })
    }

    return NextResponse.json({
      ...exam,
      tooth_data: toothData,
    })
  } catch (error) {
    console.error('Error in GET /api/visual-examinations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 視診検査を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params
    const { examination_date, notes, tooth_data } = body
    const supabase = getSupabaseClient()

    // 検査レコードを更新（examination_dateとnotesが渡された場合のみ）
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (examination_date !== undefined) {
      updateData.examination_date = examination_date
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data: exam, error: examError } = await supabase
      .from('visual_examinations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (examError) {
      console.error('Error updating visual examination:', examError)
      return NextResponse.json({ error: examError.message }, { status: 500 })
    }

    // 歯牙データを更新する場合
    if (tooth_data) {
      // 既存の歯牙データを削除
      await supabase.from('visual_tooth_data').delete().eq('examination_id', id)

      // 新しい歯牙データを挿入
      const toothDataWithExamId = tooth_data.map((tooth: any) => ({
        ...tooth,
        examination_id: id,
      }))

      const { data: toothDataResult, error: toothError } = await supabase
        .from('visual_tooth_data')
        .insert(toothDataWithExamId)
        .select()

      if (toothError) {
        console.error('Error updating tooth data:', toothError)
        return NextResponse.json({ error: toothError.message }, { status: 500 })
      }

      return NextResponse.json({
        ...exam,
        tooth_data: toothDataResult,
      })
    }

    // 既存の歯牙データを取得
    const { data: toothData } = await supabase
      .from('visual_tooth_data')
      .select('*')
      .eq('examination_id', id)
      .order('tooth_number')

    return NextResponse.json({
      ...exam,
      tooth_data: toothData || [],
    })
  } catch (error) {
    console.error('Error in PUT /api/visual-examinations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 視診検査を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabaseClient()

    // 歯牙データは ON DELETE CASCADE で自動削除される
    const { error } = await supabase
      .from('visual_examinations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting visual examination:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/visual-examinations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
