import { NextRequest, NextResponse } from 'next/server'
import { normalizeInvitationCode, validateInvitationCodeFormat } from '@/lib/line/invitation-code'
import { getPrismaClient } from '@/lib/prisma-client'
import { jsonToObject } from '@/lib/prisma-helpers'

/**
 * POST /api/line/link-patient
 * 招待コード + 生年月日で患者とLINEアカウントを連携
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    // リクエストボディを取得
    const body = await request.json()
    const { line_user_id, invitation_code, birth_date } = body

    // バリデーション
    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDは必須です' },
        { status: 400 }
      )
    }

    if (!invitation_code) {
      return NextResponse.json(
        { error: '招待コードは必須です' },
        { status: 400 }
      )
    }

    if (!birth_date) {
      return NextResponse.json(
        { error: '生年月日は必須です' },
        { status: 400 }
      )
    }

    // 招待コードを正規化
    const normalizedCode = normalizeInvitationCode(invitation_code)

    // 招待コードのフォーマットを検証
    if (!validateInvitationCodeFormat(normalizedCode)) {
      console.error('❌ 招待コードフォーマットエラー:', normalizedCode)
      return NextResponse.json(
        { error: '招待コードの形式が正しくありません' },
        { status: 400 }
      )
    }

    // 招待コードを検索
    const currentTime = new Date()

    const invitationData = await prisma.line_invitation_codes.findFirst({
      where: {
        invitation_code: normalizedCode,
        status: 'pending',
        expires_at: { gt: currentTime }
      }
    })


    if (!invitationData) {
      console.error('❌ 招待コード検索失敗:', {
        code: normalizedCode,
      })

      return NextResponse.json(
        { error: '招待コードが見つからないか、有効期限が切れています' },
        { status: 404 }
      )
    }

    // 患者情報を取得
    const patient = await prisma.patients.findUnique({
      where: { id: invitationData.patient_id }
    })

    if (!patient) {
      console.error('❌ 患者情報取得失敗:', {
        patient_id: invitationData.patient_id,
      })
      return NextResponse.json(
        { error: '患者情報が見つかりません' },
        { status: 404 }
      )
    }

    // 生年月日の比較（Prismaは Date オブジェクトを返すので文字列に変換して比較）
    const patientBirthDate = patient.birth_date
      ? patient.birth_date.toISOString().split('T')[0]
      : null

    if (patientBirthDate !== birth_date) {
      console.error('❌ 生年月日不一致:', {
        expected: patientBirthDate,
        received: birth_date
      })
      return NextResponse.json(
        { error: '生年月日が一致しません' },
        { status: 401 }
      )
    }

    // 既に連携されているかチェック
    const existingLinkage = await prisma.line_patient_linkages.findFirst({
      where: {
        line_user_id,
        patient_id: patient.id,
      },
      select: { id: true }
    })

    if (existingLinkage) {
      return NextResponse.json(
        { error: 'この患者は既に連携されています' },
        { status: 409 }
      )
    }

    // このLINEユーザーの連携数を確認
    const existingLinkages = await prisma.line_patient_linkages.findMany({
      where: { line_user_id },
      select: { id: true }
    })

    // 初回連携の場合はis_primary=true
    const is_primary = existingLinkages.length === 0

    // 患者連携を作成
    const linkage = await prisma.line_patient_linkages.create({
      data: {
        line_user_id,
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        relationship: is_primary ? 'self' : 'other',
        is_primary,
        linked_at: new Date(),
      }
    })

    // 招待コードを使用済みに更新
    try {
      await prisma.line_invitation_codes.update({
        where: { id: invitationData.id },
        data: {
          status: 'used',
          used_at: new Date(),
        }
      })
    } catch (updateError) {
      console.error('招待コード更新エラー:', updateError)
      // エラーでも連携は成功しているので継続
    }

    // QRコードを自動生成
    const qr_token = `${patient.clinic_id}-${patient.id}-${Date.now()}`

    try {
      await prisma.patient_qr_codes.create({
        data: {
          patient_id: patient.id,
          clinic_id: patient.clinic_id,
          qr_token,
          expires_at: null, // 無期限
          usage_count: 0,
        }
      })
    } catch (qrError) {
      console.error('QRコード生成エラー:', qrError)
      // QRコード生成エラーは無視（後で生成可能）
    }

    // リッチメニューを連携済み用に切り替え
    try {
      console.log('🔄 リッチメニュー切り替え開始:', {
        clinic_id: patient.clinic_id,
        line_user_id,
        is_linked: true
      })

      const richMenuResponse = await fetch(`${request.nextUrl.origin}/api/line/switch-rich-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: patient.clinic_id,
          line_user_id,
          is_linked: true
        })
      })

      const richMenuResult = await richMenuResponse.json()

      if (richMenuResponse.ok) {
        console.log('✅ リッチメニュー切り替え成功:', richMenuResult)
      } else {
        console.error('❌ リッチメニュー切り替え失敗:', {
          status: richMenuResponse.status,
          error: richMenuResult
        })
      }
    } catch (richMenuError) {
      console.error('❌ リッチメニュー切り替え例外:', richMenuError)
      // リッチメニューエラーは無視（後で手動切り替え可能）
    }

    // カスタム通知設定を確認
    const { canReceiveNotification } = await import('@/lib/api/patient-notification-preferences')
    const canReceiveLinkNotification = await canReceiveNotification(patient.id, patient.clinic_id, 'custom').catch(() => true)

    // LINE連携完了通知を送信
    if (canReceiveLinkNotification) {
    try {
      console.log('📨 LINE連携完了通知送信開始')

      // クリニック情報を取得
      const clinic = await prisma.clinics.findUnique({
        where: { id: patient.clinic_id },
        select: { name: true }
      })

      // 通知テンプレートを取得（line_linkage_completeタイプ）
      const template = await prisma.notification_templates.findFirst({
        where: {
          clinic_id: patient.clinic_id,
          notification_type: 'line_linkage_complete',
        },
        select: { line_message: true }
      })

      // LINE設定を取得
      const lineSettings = await prisma.clinic_settings.findFirst({
        where: {
          clinic_id: patient.clinic_id,
          setting_key: 'line',
        },
        select: { setting_value: true }
      })

      const channelAccessToken = jsonToObject<any>(lineSettings?.setting_value)?.channel_access_token

      if (channelAccessToken) {
        // テンプレートのメッセージを使用（変数を置換）
        let message = template?.line_message || `${patient.last_name} ${patient.first_name}様\n\nLINE連携が完了しました！\n\nこれからは、LINEから予約確認やリマインドを受け取ることができます。\n\n下のメニューからご利用ください。`

        // 変数を置換
        message = message
          .replace(/{patient_name}/g, `${patient.last_name} ${patient.first_name}`)
          .replace(/{clinic_name}/g, clinic?.name || 'クリニック')

        // LINEメッセージを送信
        const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${channelAccessToken}`
          },
          body: JSON.stringify({
            to: line_user_id,
            messages: [
              {
                type: 'text',
                text: message
              }
            ]
          })
        })

        if (lineResponse.ok) {
          console.log('✅ LINE連携完了通知送信成功')
        } else {
          const errorBody = await lineResponse.text()
          console.error('❌ LINE連携完了通知送信失敗:', errorBody)
        }
      } else {
        console.log('⚠️ LINE Channel Access Tokenが設定されていないため通知をスキップ')
      }
    } catch (notificationError) {
      console.error('❌ LINE連携完了通知送信例外:', notificationError)
      // 通知エラーは無視（連携自体は成功しているため）
    }
    }

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      linkage: {
        id: linkage.id,
        patient: {
          id: patient.id,
          name: `${patient.last_name} ${patient.first_name}`,
          patient_number: patient.patient_number,
        },
        is_primary,
        linked_at: linkage.linked_at?.toISOString() || null,
      },
    })

  } catch (error) {
    console.error('患者連携エラー:', error)
    return NextResponse.json(
      { error: '患者連携に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/line/link-patient?line_user_id=xxx
 * LINEユーザーの連携患者一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/line/link-patient - 開始')

    const prisma = getPrismaClient()

    const searchParams = request.nextUrl.searchParams
    const line_user_id = searchParams.get('line_user_id')

    console.log('📊 リクエストパラメータ:', { line_user_id })

    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDは必須です' },
        { status: 400 }
      )
    }

    // 連携データを取得
    const linkages = await prisma.line_patient_linkages.findMany({
      where: { line_user_id },
      orderBy: [
        { is_primary: 'desc' },
        { linked_at: 'desc' }
      ]
    })

    console.log('📊 連携データ取得結果:', {
      linkages_count: linkages.length,
      line_user_id
    })

    // 連携がない場合は空配列を返す
    if (linkages.length === 0) {
      console.log('ℹ️ 連携データなし')
      return NextResponse.json({ linkages: [] })
    }

    // 各連携の患者情報を取得
    const linkagesWithPatients = await Promise.all(
      linkages.map(async (linkage) => {
        const patient = await prisma.patients.findUnique({
          where: { id: linkage.patient_id },
          select: {
            id: true,
            clinic_id: true,
            patient_number: true,
            last_name: true,
            first_name: true,
            last_name_kana: true,
            first_name_kana: true,
            birth_date: true,
            gender: true,
            phone: true,
            email: true,
          }
        })

        // birth_date を文字列に変換
        const patientData = patient ? {
          ...patient,
          birth_date: patient.birth_date ? patient.birth_date.toISOString().split('T')[0] : null,
        } : null

        return {
          ...linkage,
          linked_at: linkage.linked_at?.toISOString() || null,
          created_at: linkage.created_at?.toISOString() || null,
          updated_at: linkage.updated_at?.toISOString() || null,
          patients: patientData
        }
      })
    )

    console.log('✅ 連携患者取得成功:', linkagesWithPatients.length, '件')
    return NextResponse.json({ linkages: linkagesWithPatients })

  } catch (error) {
    console.error('連携患者取得エラー:', error)
    return NextResponse.json(
      { error: '連携患者の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/line/link-patient?linkage_id=xxx
 * 患者連携を解除
 */
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const searchParams = request.nextUrl.searchParams
    const linkage_id = searchParams.get('linkage_id')

    if (!linkage_id) {
      return NextResponse.json(
        { error: '連携IDは必須です' },
        { status: 400 }
      )
    }

    // 連携を削除
    try {
      await prisma.line_patient_linkages.delete({
        where: { id: linkage_id }
      })
    } catch (deleteError) {
      console.error('連携解除エラー:', deleteError)
      return NextResponse.json(
        { error: '連携解除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('連携解除エラー:', error)
    return NextResponse.json(
      { error: '連携解除に失敗しました' },
      { status: 500 }
    )
  }
}
