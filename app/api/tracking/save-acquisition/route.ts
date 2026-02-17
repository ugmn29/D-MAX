import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['first_visit_at', 'booking_completed_at', 'created_at'] as const

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

    const prisma = getPrismaClient()

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
    const data = await prisma.patient_acquisition_sources.create({
      data: {
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
        first_visit_at: utm_data?.first_visit_at ? new Date(utm_data.first_visit_at) : null,
        booking_completed_at: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: convertDatesToStrings(data, [...DATE_FIELDS]) })
  } catch (error) {
    console.error('獲得経路APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
