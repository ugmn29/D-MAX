import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patient_id,
      clinic_id,
      utm_data,
      questionnaire_source,
      questionnaire_detail,
    } = body

    // 必須フィールドの検証
    if (!patient_id || !clinic_id) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // UTMデータまたはアンケート回答のどちらかが必要
    const hasUTM = utm_data && Object.keys(utm_data.utm || {}).length > 0
    const hasQuestionnaire = questionnaire_source

    if (!hasUTM && !hasQuestionnaire) {
      return NextResponse.json(
        { error: 'Either UTM data or questionnaire source is required' },
        { status: 400 }
      )
    }

    // 最終的な流入元を決定（UTM優先）
    let final_source: string
    let tracking_method: 'utm' | 'questionnaire'

    if (hasUTM) {
      // UTMがある場合はUTMを優先
      const utmSource = utm_data.utm.utm_source || 'unknown'
      const utmMedium = utm_data.utm.utm_medium || ''
      final_source = utmMedium ? `${utmSource}/${utmMedium}` : utmSource
      tracking_method = 'utm'
    } else {
      // UTMがない場合はアンケート回答を使用
      final_source = questionnaire_source || 'unknown'
      tracking_method = 'questionnaire'
    }

    // 獲得経路を記録
    const { data, error } = await supabase
      .from('patient_acquisition_sources')
      .insert({
        patient_id,
        clinic_id,
        utm_source: utm_data?.utm.utm_source || null,
        utm_medium: utm_data?.utm.utm_medium || null,
        utm_campaign: utm_data?.utm.utm_campaign || null,
        utm_content: utm_data?.utm.utm_content || null,
        utm_term: utm_data?.utm.utm_term || null,
        device_type: utm_data?.device.device_type || null,
        os: utm_data?.device.os || null,
        browser: utm_data?.device.browser || null,
        questionnaire_source: questionnaire_source || null,
        questionnaire_detail: questionnaire_detail || null,
        final_source,
        tracking_method,
        first_visit_at: utm_data?.first_visit_at || null,
        booking_completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('獲得経路記録エラー:', error)
      return NextResponse.json(
        { error: 'Failed to save acquisition source' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('獲得経路APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
