import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { jsonToObject } from '@/lib/prisma-helpers'

/**
 * GET /api/line/diagnose
 * リッチメニュー切り替え機能の診断情報を返す
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    // クリニックID取得
    const clinics = await prisma.clinics.findMany({
      select: { id: true, name: true },
      take: 1
    })

    if (!clinics || clinics.length === 0) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 })
    }

    const clinicId = clinics[0].id

    // LINE基本設定
    const lineSettings = await prisma.clinic_settings.findFirst({
      where: {
        clinic_id: clinicId,
        setting_key: 'line',
      },
      select: { setting_value: true }
    })

    const lineValue = jsonToObject<any>(lineSettings?.setting_value)
    const channelAccessToken = lineValue?.channel_access_token
    const isTestToken = channelAccessToken && channelAccessToken.startsWith('test-')

    // リッチメニューID設定
    const richMenuSettings = await prisma.clinic_settings.findFirst({
      where: {
        clinic_id: clinicId,
        setting_key: 'line_rich_menu',
      },
      select: { setting_value: true }
    })

    const richMenuValue = jsonToObject<any>(richMenuSettings?.setting_value)
    const registeredMenuId = richMenuValue?.line_registered_rich_menu_id
    const unregisteredMenuId = richMenuValue?.line_unregistered_rich_menu_id

    // 患者データ（最新10件）
    const patients = await prisma.patients.findMany({
      where: { clinic_id: clinicId },
      select: {
        id: true,
        patient_number: true,
        last_name: true,
        first_name: true,
        updated_at: true,
      },
      orderBy: { updated_at: 'desc' },
      take: 10
    })

    // line_patient_id は patients テーブルに存在しないため、
    // line_user_links テーブルから連携済み患者を取得
    const linkedPatientIds = await prisma.line_patient_linkages.findMany({
      where: { clinic_id: clinicId },
      select: { patient_id: true }
    })
    const linkedPatientIdSet = new Set(linkedPatientIds.map(l => l.patient_id))
    const linkedPatients = patients.filter(p => linkedPatientIdSet.has(p.id))

    // 連携履歴
    const linkages = await prisma.line_patient_linkages.findMany({
      where: { clinic_id: clinicId },
      select: { id: true, line_user_id: true, patient_id: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: 5
    })

    // 診断結果
    const diagnosis: any = {
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
        total: patients.length,
        linkedCount: linkedPatients.length,
        recent: linkedPatients.slice(0, 3).map(p => ({
          name: `${p.last_name || ''} ${p.first_name || ''}`.trim(),
          patientNumber: p.patient_number,
          updatedAt: p.updated_at?.toISOString() || null
        }))
      },
      linkageHistory: {
        count: linkages.length,
        recent: linkages.slice(0, 3).map(l => ({
          lineUserId: l.line_user_id,  // 完全なIDを返す
          createdAt: l.created_at?.toISOString() || null
        }))
      },
      issues: [] as any[]
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

    if (linkedPatients.length > 0 && linkages.length === 0) {
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
