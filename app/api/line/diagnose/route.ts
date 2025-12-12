import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/line/diagnose
 * リッチメニュー切り替え機能の診断情報を返す
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase Admin not initialized' }, { status: 500 })
    }

    // クリニックID取得
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id, name')
      .limit(1)

    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 })
    }

    const clinicId = clinics[0].id

    // LINE基本設定
    const { data: lineSettings } = await supabase
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinicId)
      .eq('setting_key', 'line')
      .maybeSingle()

    const channelAccessToken = lineSettings?.setting_value?.channel_access_token
    const isTestToken = channelAccessToken && channelAccessToken.startsWith('test-')

    // リッチメニューID設定
    const { data: richMenuSettings } = await supabase
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinicId)
      .eq('setting_key', 'line_rich_menu')
      .maybeSingle()

    const registeredMenuId = richMenuSettings?.setting_value?.line_registered_rich_menu_id
    const unregisteredMenuId = richMenuSettings?.setting_value?.line_unregistered_rich_menu_id

    // 患者データ（最新10件）
    const { data: patients } = await supabase
      .from('patients')
      .select('id, patient_number, last_name, first_name, line_patient_id, updated_at')
      .eq('clinic_id', clinicId)
      .order('updated_at', { ascending: false })
      .limit(10)

    const linkedPatients = patients?.filter(p => p.line_patient_id) || []

    // 連携履歴
    const { data: linkages } = await supabase
      .from('line_patient_linkages')
      .select('id, line_user_id, patient_id, created_at')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(5)

    // 診断結果
    const diagnosis = {
      clinic: {
        id: clinicId,
        name: clinics[0].name
      },
      lineSettings: {
        hasToken: !!channelAccessToken,
        isTestToken,
        tokenPreview: channelAccessToken ? channelAccessToken.substring(0, 40) + '...' : null
      },
      richMenuSettings: {
        hasRegisteredMenu: !!registeredMenuId,
        hasUnregisteredMenu: !!unregisteredMenuId,
        registeredMenuId,
        unregisteredMenuId
      },
      patients: {
        total: patients?.length || 0,
        linkedCount: linkedPatients.length,
        recent: linkedPatients.slice(0, 3).map(p => ({
          name: `${p.last_name || ''} ${p.first_name || ''}`.trim(),
          patientNumber: p.patient_number,
          lineUserId: p.line_patient_id?.substring(0, 30) + '...',
          updatedAt: p.updated_at
        }))
      },
      linkageHistory: {
        count: linkages?.length || 0,
        recent: linkages?.slice(0, 3).map(l => ({
          lineUserId: l.line_user_id.substring(0, 30) + '...',
          createdAt: l.created_at
        })) || []
      },
      issues: []
    }

    // 問題の特定
    if (isTestToken) {
      diagnosis.issues.push({
        severity: 'critical',
        message: 'テストトークンが設定されています。本番のChannel Access Tokenに変更してください。'
      })
    } else if (!channelAccessToken) {
      diagnosis.issues.push({
        severity: 'critical',
        message: 'Channel Access Tokenが未設定です。'
      })
    }

    if (!registeredMenuId || !unregisteredMenuId) {
      diagnosis.issues.push({
        severity: 'critical',
        message: 'リッチメニューIDが未設定です。設定ページで「既存メニューを自動読み込み」を実行してください。'
      })
    }

    if (linkedPatients.length > 0 && (!linkages || linkages.length === 0)) {
      diagnosis.issues.push({
        severity: 'warning',
        message: 'LINE連携済み患者がいますが、連携履歴テーブルに記録がありません。リッチメニュー切り替え処理が実行されていない可能性があります。'
      })
    }

    if (diagnosis.issues.length === 0) {
      diagnosis.issues.push({
        severity: 'info',
        message: 'すべての設定が正しいです。リッチメニュー切り替えは動作するはずです。'
      })
    }

    return NextResponse.json(diagnosis)

  } catch (error) {
    console.error('診断エラー:', error)
    return NextResponse.json(
      {
        error: 'Diagnostic error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
