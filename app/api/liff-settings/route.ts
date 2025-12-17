import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/liff-settings
 * LIFF IDをデータベースから取得（認証不要・公開API）
 */
export async function GET(request: NextRequest) {
  try {
    // デフォルトのclinic_id
    const clinicId = '11111111-1111-1111-1111-111111111111'

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // line設定からLIFF IDを取得
    const { data: lineSettings, error: lineError } = await supabaseAdmin
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinicId)
      .eq('setting_key', 'line')
      .single()

    if (lineError && lineError.code !== 'PGRST116') {
      console.error('LIFF設定取得エラー:', lineError)
    }

    // notification_settings からも取得を試みる
    const { data: notificationSettings, error: notifError } = await supabaseAdmin
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinicId)
      .eq('setting_key', 'notification_settings')
      .single()

    if (notifError && notifError.code !== 'PGRST116') {
      console.error('notification_settings取得エラー:', notifError)
    }

    // line設定 または notification_settings.line からLIFF IDを取得
    const lineConfig = lineSettings?.setting_value || {}
    const notifLineConfig = notificationSettings?.setting_value?.line || {}

    // 優先順位: line設定 > notification_settings.line
    const liffIds = {
      initial_link: lineConfig.liff_id_initial_link || notifLineConfig.liff_id_initial_link || null,
      qr_code: lineConfig.liff_id_qr_code || notifLineConfig.liff_id_qr_code || null,
      family_register: lineConfig.liff_id_family_register || notifLineConfig.liff_id_family_register || null,
      appointments: lineConfig.liff_id_appointments || notifLineConfig.liff_id_appointments || null,
      web_booking: lineConfig.liff_id_web_booking || notifLineConfig.liff_id_web_booking || null,
    }

    return NextResponse.json(liffIds)

  } catch (error) {
    console.error('LIFF設定取得エラー:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LIFF settings' },
      { status: 500 }
    )
  }
}
