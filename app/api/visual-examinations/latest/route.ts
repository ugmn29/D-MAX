import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

// GET - 最新の視診検査を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data: exam, error: examError } = await supabase
      .from('visual_examinations')
      .select('*')
      .eq('patient_id', patientId)
      .order('examination_date', { ascending: false })
      .limit(1)
      .single()

    if (examError) {
      if (examError.code === 'PGRST116') {
        // No rows found
        return NextResponse.json(null)
      }
      console.error('Error fetching latest visual examination:', examError)
      return NextResponse.json({ error: examError.message }, { status: 500 })
    }

    const { data: toothData } = await supabase
      .from('visual_tooth_data')
      .select('*')
      .eq('examination_id', exam.id)
      .order('tooth_number')

    return NextResponse.json({
      ...exam,
      tooth_data: toothData || [],
    })
  } catch (error) {
    console.error('Error in GET /api/visual-examinations/latest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
