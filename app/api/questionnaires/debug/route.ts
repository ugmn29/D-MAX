import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function GET() {
  try {
    const supabase = getSupabaseClient()

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
