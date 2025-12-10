import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const responseId = searchParams.get('response_id')
    const supabase = getSupabaseClient()

    console.log('🔍 問診票データのデバッグ開始')

    // 特定の問診票回答の詳細を取得
    if (responseId) {
      console.log(`📋 問診票回答ID: ${responseId} の詳細を取得中...`)

      // 1. 問診票回答データを取得
      const { data: response, error: responseError } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('id', responseId)
        .single()

      if (responseError) {
        return NextResponse.json({
          success: false,
          error: '問診票回答の取得に失敗しました',
          details: responseError.message
        }, { status: 404 })
      }

      // 2. 問診票の質問定義を取得
      const { data: questions, error: questionsError } = await supabase
        .from('questionnaire_questions')
        .select('*')
        .eq('questionnaire_id', response.questionnaire_id)
        .order('sort_order', { ascending: true })

      if (questionsError) {
        console.error('❌ 質問定義取得エラー:', questionsError)
      }

      // 3. 患者情報を取得（連携済みの場合）
      let patient = null
      if (response.patient_id) {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', response.patient_id)
          .single()

        if (!patientError) {
          patient = patientData
        }
      }

      return NextResponse.json({
        success: true,
        response: {
          id: response.id,
          questionnaire_id: response.questionnaire_id,
          patient_id: response.patient_id,
          appointment_id: response.appointment_id,
          completed_at: response.completed_at,
          created_at: response.created_at,
          updated_at: response.updated_at,
          response_data: response.response_data
        },
        questions: questions?.map(q => ({
          id: q.id,
          section_name: q.section_name,
          question_text: q.question_text,
          question_type: q.question_type,
          linked_field: q.linked_field,
          sort_order: q.sort_order,
          answer: response.response_data?.[q.id] || null
        })),
        patient: patient ? {
          id: patient.id,
          last_name: patient.last_name,
          first_name: patient.first_name,
          last_name_kana: patient.last_name_kana,
          first_name_kana: patient.first_name_kana,
          birth_date: patient.birth_date,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
          postal_code: patient.postal_code,
          address: patient.address,
          allergies: patient.allergies,
          medical_history: patient.medical_history,
          medications: patient.medications,
          is_registered: patient.is_registered,
          updated_at: patient.updated_at
        } : null,
        analysis: {
          total_questions: questions?.length || 0,
          questions_with_linked_field: questions?.filter(q => q.linked_field).length || 0,
          response_data_keys: Object.keys(response.response_data || {}).length,
          patient_linked: !!response.patient_id,
          patient_registered: patient?.is_registered || false
        }
      })
    }

    console.log('🔍 問診票データのデバッグ開始')

    // 1. 全ての問診票回答を取得
    const { data: allResponses, error: responsesError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (responsesError) {
      console.error('❌ 問診票回答取得エラー:', responsesError)
    } else {
      console.log(`✅ 問診票回答取得成功: ${allResponses?.length || 0}件`)
    }

    // 2. patient_idがnullの未連携問診票を取得
    const { data: unlinkedResponses, error: unlinkedError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .is('patient_id', null)
      .order('created_at', { ascending: false })

    if (unlinkedError) {
      console.error('❌ 未連携問診票取得エラー:', unlinkedError)
    } else {
      console.log(`✅ 未連携問診票: ${unlinkedResponses?.length || 0}件`)
    }

    // 3. 仮登録患者の問診票を取得
    const { data: tempPatientResponses, error: tempError } = await supabase
      .from('questionnaire_responses')
      .select(`
        *,
        patients!inner (
          id,
          first_name,
          last_name,
          is_registered
        )
      `)
      .eq('patients.is_registered', false)
      .order('created_at', { ascending: false })

    if (tempError) {
      console.error('❌ 仮登録患者問診票取得エラー:', tempError)
    } else {
      console.log(`✅ 仮登録患者の問診票: ${tempPatientResponses?.length || 0}件`)
    }

    // 4. 最新10件の詳細情報
    const recentDetails = (allResponses || []).slice(0, 10).map(r => ({
      id: r.id,
      questionnaire_id: r.questionnaire_id,
      patient_id: r.patient_id || 'NULL (未連携)',
      completed_at: r.completed_at,
      created_at: r.created_at,
      has_response_data: !!r.response_data,
      response_data_keys: r.response_data ? Object.keys(r.response_data).length : 0
    }))

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_responses: allResponses?.length || 0,
        unlinked_responses: unlinkedResponses?.length || 0,
        temp_patient_responses: tempPatientResponses?.length || 0
      },
      recent_responses: recentDetails,
      unlinked_responses_detail: (unlinkedResponses || []).map(r => ({
        id: r.id,
        questionnaire_id: r.questionnaire_id,
        completed_at: r.completed_at,
        created_at: r.created_at,
        patient_name: r.response_data?.patient_name || 'N/A',
        patient_phone: r.response_data?.patient_phone || 'N/A'
      })),
      temp_patient_responses_detail: (tempPatientResponses || []).map((r: any) => ({
        id: r.id,
        questionnaire_id: r.questionnaire_id,
        patient_id: r.patient_id,
        patient_name: r.patients ? `${r.patients.last_name} ${r.patients.first_name}` : 'N/A',
        is_registered: r.patients?.is_registered,
        completed_at: r.completed_at
      }))
    })

  } catch (error: any) {
    console.error('❌ デバッグAPI実行エラー:', error)
    return NextResponse.json({
      success: false,
      error: 'デバッグAPI実行エラー',
      details: error.message
    }, { status: 500 })
  }
}
