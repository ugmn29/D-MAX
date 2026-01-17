import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

// POST - 歯周検査を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patient_id, clinic_id, examination_date, examiner_id, measurement_type, examination_phase, notes, tooth_data } = body
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
        examination_phase,
        notes,
      })
      .select()
      .single()

    if (examError) {
      console.error('Error creating periodontal examination:', examError)
      return NextResponse.json({ error: examError.message }, { status: 500 })
    }

    // P検TODOを自動作成（examination_phaseが指定されている場合）
    if (examination_phase && ['P_EXAM_1', 'P_EXAM_2', 'P_EXAM_3', 'P_EXAM_4'].includes(examination_phase)) {
      // 既存の最大sort_orderを取得
      const { data: existingPlans } = await supabase
        .from('treatment_plans')
        .select('sort_order')
        .eq('clinic_id', clinic_id)
        .eq('patient_id', patient_id)
        .order('sort_order', { ascending: false })
        .limit(1)

      let currentSortOrder = existingPlans && existingPlans.length > 0 ? existingPlans[0].sort_order : -1

      // P検の名称を決定
      const phaseNames: Record<string, string> = {
        'P_EXAM_1': 'P検①',
        'P_EXAM_2': 'P検②',
        'P_EXAM_3': 'P検③',
        'P_EXAM_4': 'P検④'
      }

      // P検TODOを作成
      const { error: planError } = await supabase
        .from('treatment_plans')
        .insert({
          clinic_id,
          patient_id,
          treatment_content: phaseNames[examination_phase] || 'P検査',
          staff_type: 'hygienist',
          priority: 2,
          sort_order: currentSortOrder + 1,
          periodontal_phase: examination_phase,
          status: 'completed', // P検データが作成された時点で完了とみなす
          completed_at: new Date().toISOString(),
          implemented_date: examination_date || new Date().toISOString().split('T')[0],
          is_memo: false
        })

      if (planError) {
        console.error('Error creating P検 TODO:', planError)
        // P検TODO作成エラーは致命的ではないので、処理は継続
      }

      currentSortOrder++

      // P検①の場合: 初期治療TODOを自動生成
      if (examination_phase === 'P_EXAM_1') {
        const initialTreatments = [
          { content: 'Sc（スケーリング）', type: 'Sc' },
          { content: 'Poli（研磨）', type: 'Poli' },
          { content: 'TBI（ブラッシング指導）', type: 'TBI' }
        ]

        for (const treatment of initialTreatments) {
          const { error: initialTreatmentError } = await supabase
            .from('treatment_plans')
            .insert({
              clinic_id,
              patient_id,
              treatment_content: treatment.content,
              staff_type: 'hygienist',
              priority: 2,
              sort_order: currentSortOrder + 1,
              periodontal_phase: 'INITIAL',
              hygienist_menu_type: treatment.type,
              status: 'planned',
              is_memo: false
            })

          if (initialTreatmentError) {
            console.error(`Error creating ${treatment.type} TODO:`, initialTreatmentError)
          }
          currentSortOrder++
        }
      }
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
