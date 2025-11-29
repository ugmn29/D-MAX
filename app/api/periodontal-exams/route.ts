import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

// POST - 歯周検査を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patient_id, clinic_id, examination_date, examiner_id, measurement_type, notes, tooth_data } = body
    const supabase = getSupabaseClient()

    // 歯周検査レコードを作成
    const { data: exam, error: examError } = await supabase
      .from('periodontal_examinations')
      .insert({
        patient_id,
        clinic_id,
        examination_date: examination_date || new Date().toISOString().split('T')[0],
        examiner_id,
        measurement_type,
        notes,
      })
      .select()
      .single()

    if (examError) {
      console.error('Error creating periodontal examination:', examError)
      return NextResponse.json({ error: examError.message }, { status: 500 })
    }

    // 歯牙データを作成
    if (tooth_data && tooth_data.length > 0) {
      const toothDataWithExamId = tooth_data.map((tooth: any) => ({
        ...tooth,
        examination_id: exam.id,
      }))

      const { data: toothDataResult, error: toothError } = await supabase
        .from('periodontal_tooth_data')
        .insert(toothDataWithExamId)
        .select()

      if (toothError) {
        console.error('Error creating tooth data:', toothError)
        // エラーが発生した場合、検査レコードも削除
        await supabase.from('periodontal_examinations').delete().eq('id', exam.id)
        return NextResponse.json({ error: toothError.message }, { status: 500 })
      }

      return NextResponse.json({
        ...exam,
        tooth_data: toothDataResult,
      })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error in POST /api/periodontal-exams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - 患者の歯周検査一覧を取得
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

    const { data: exams, error: examsError } = await supabase
      .from('periodontal_examinations')
      .select('*')
      .eq('patient_id', patientId)
      .order('examination_date', { ascending: false })

    if (examsError) {
      console.error('Error fetching periodontal examinations:', examsError)
      return NextResponse.json({ error: examsError.message }, { status: 500 })
    }

    // 各検査の歯牙データを取得
    const examsWithToothData = await Promise.all(
      (exams || []).map(async (exam) => {
        const { data: toothData } = await supabase
          .from('periodontal_tooth_data')
          .select('*')
          .eq('examination_id', exam.id)
          .order('tooth_number')

        return {
          ...exam,
          tooth_data: toothData || [],
        }
      })
    )

    return NextResponse.json(examsWithToothData)
  } catch (error) {
    console.error('Error in GET /api/periodontal-exams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
