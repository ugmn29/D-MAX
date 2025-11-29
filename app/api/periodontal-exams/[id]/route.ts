import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

// GET - 特定の歯周検査を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const supabase = getSupabaseClient()

    // 検査レコードを取得
    const { data: exam, error: examError } = await supabase
      .from('periodontal_examinations')
      .select('*')
      .eq('id', examId)
      .single()

    if (examError) {
      console.error('Error fetching periodontal examination:', examError)
      return NextResponse.json({ error: examError.message }, { status: 500 })
    }

    // 歯牙データを取得
    const { data: toothData, error: toothError } = await supabase
      .from('periodontal_tooth_data')
      .select('*')
      .eq('examination_id', examId)
      .order('tooth_number')

    if (toothError) {
      console.error('Error fetching tooth data:', toothError)
      return NextResponse.json({ error: toothError.message }, { status: 500 })
    }

    return NextResponse.json({
      ...exam,
      tooth_data: toothData || [],
    })
  } catch (error) {
    console.error('Error in GET /api/periodontal-exams/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - 歯周検査を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const body = await request.json()
    const { examination_date, measurement_type, notes, tooth_data } = body
    const supabase = getSupabaseClient()

    // 検査レコードを更新（更新項目がある場合のみ）
    const updateData: any = {}
    if (examination_date !== undefined) updateData.examination_date = examination_date
    if (measurement_type !== undefined) updateData.measurement_type = measurement_type
    if (notes !== undefined) updateData.notes = notes

    let exam
    if (Object.keys(updateData).length > 0) {
      // 更新項目がある場合は更新
      const { data, error: examError } = await supabase
        .from('periodontal_examinations')
        .update(updateData)
        .eq('id', examId)
        .select()
        .single()

      if (examError) {
        console.error('Error updating periodontal examination:', examError)
        return NextResponse.json({ error: examError.message }, { status: 500 })
      }
      exam = data
    } else {
      // 更新項目がない場合は既存のレコードを取得
      const { data, error: examError } = await supabase
        .from('periodontal_examinations')
        .select()
        .eq('id', examId)
        .single()

      if (examError) {
        console.error('Error fetching periodontal examination:', examError)
        return NextResponse.json({ error: examError.message }, { status: 500 })
      }
      exam = data
    }

    // 歯牙データを更新
    if (tooth_data) {
      // 既存のデータを削除
      await supabase
        .from('periodontal_tooth_data')
        .delete()
        .eq('examination_id', examId)

      // 新しいデータを挿入
      if (tooth_data.length > 0) {
        const toothDataWithExamId = tooth_data.map((tooth: any) => ({
          ...tooth,
          examination_id: examId,
        }))

        const { error: toothError } = await supabase
          .from('periodontal_tooth_data')
          .insert(toothDataWithExamId)

        if (toothError) {
          console.error('Error updating tooth data:', toothError)
          return NextResponse.json({ error: toothError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error in PUT /api/periodontal-exams/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - 歯周検査を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('periodontal_examinations')
      .delete()
      .eq('id', examId)

    if (error) {
      console.error('Error deleting periodontal examination:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/periodontal-exams/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
