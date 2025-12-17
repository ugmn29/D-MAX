import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// メモリキャッシュ（5分間有効）
let cachedLiffIds: any = null
let cacheExpiry: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5分

/**
 * GET /api/liff-settings
 * LIFF IDをデータベースから取得（認証不要・公開API）
 * キャッシュ対応で高速化
 */
export async function GET(request: NextRequest) {
  try {
    // メモリキャッシュをチェック
    const now = Date.now()
    if (cachedLiffIds && now < cacheExpiry) {
      return NextResponse.json(cachedLiffIds, {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Cache': 'HIT'
        }
      })
    }

    // デフォルトのclinic_id
    const clinicId = '11111111-1111-1111-1111-111111111111'

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // 1回のクエリで両方の設定を取得（最適化）
    const { data: settings, error } = await supabaseAdmin
      .from('clinic_settings')
      .select('setting_key, setting_value')
      .eq('clinic_id', clinicId)
      .in('setting_key', ['line', 'notification_settings'])

    if (error) {
      console.error('LIFF設定取得エラー:', error)
    }

    // 設定を分類
    const lineSettings = settings?.find(s => s.setting_key === 'line')
    const notificationSettings = settings?.find(s => s.setting_key === 'notification_settings')

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

    // キャッシュを更新
    cachedLiffIds = liffIds
    cacheExpiry = now + CACHE_TTL

    return NextResponse.json(liffIds, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('LIFF設定取得エラー:', error)
    return NextResponse.json(
      { error: 'Failed to fetch LIFF settings' },
      { status: 500 }
    )
  }
}
