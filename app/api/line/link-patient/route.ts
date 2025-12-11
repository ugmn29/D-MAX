import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { normalizeInvitationCode, validateInvitationCodeFormat } from '@/lib/line/invitation-code'

/**
 * POST /api/line/link-patient
 * 招待コード + 生年月日で患者とLINEアカウントを連携
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

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
      return NextResponse.json(
        { error: '招待コードの形式が正しくありません' },
        { status: 400 }
      )
    }

    // 招待コードを検索
    const { data: invitationData, error: invitationError } = await supabase
      .from('line_invitation_codes')
      .select('*, patients(*)')
      .eq('invitation_code', normalizedCode)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitationData) {
      return NextResponse.json(
        { error: '招待コードが見つからないか、有効期限が切れています' },
        { status: 404 }
      )
    }

    // 患者の生年月日と照合
    const patient = invitationData.patients as any
    if (patient.birth_date !== birth_date) {
      return NextResponse.json(
        { error: '生年月日が一致しません' },
        { status: 401 }
      )
    }

    // 既に連携されているかチェック
    const { data: existingLinkage } = await supabase
      .from('line_patient_linkages')
      .select('id')
      .eq('line_user_id', line_user_id)
      .eq('patient_id', patient.id)
      .single()

    if (existingLinkage) {
      return NextResponse.json(
        { error: 'この患者は既に連携されています' },
        { status: 409 }
      )
    }

    // このLINEユーザーの連携数を確認
    const { data: existingLinkages, error: countError } = await supabase
      .from('line_patient_linkages')
      .select('id')
      .eq('line_user_id', line_user_id)

    if (countError) {
      console.error('連携数確認エラー:', countError)
      return NextResponse.json(
        { error: '連携状況の確認に失敗しました' },
        { status: 500 }
      )
    }

    // 初回連携の場合はis_primary=true
    const is_primary = existingLinkages.length === 0

    // 患者連携を作成
    const { data: linkage, error: linkageError } = await supabase
      .from('line_patient_linkages')
      .insert({
        line_user_id,
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        relationship: is_primary ? 'self' : 'other',
        is_primary,
        linked_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (linkageError) {
      console.error('患者連携エラー:', linkageError)
      return NextResponse.json(
        { error: '患者連携に失敗しました' },
        { status: 500 }
      )
    }

    // 招待コードを使用済みに更新
    const { error: updateError } = await supabase
      .from('line_invitation_codes')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
      })
      .eq('id', invitationData.id)

    if (updateError) {
      console.error('招待コード更新エラー:', updateError)
      // エラーでも連携は成功しているので継続
    }

    // QRコードを自動生成
    const qr_token = `${patient.clinic_id}-${patient.id}-${Date.now()}`

    const { error: qrError } = await supabase
      .from('patient_qr_codes')
      .insert({
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        qr_token,
        expires_at: null, // 無期限
        usage_count: 0,
      })

    if (qrError) {
      console.error('QRコード生成エラー:', qrError)
      // QRコード生成エラーは無視（後で生成可能）
    }

    // リッチメニューを連携済み用に切り替え
    try {
      await fetch(`${request.nextUrl.origin}/api/line/switch-rich-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: patient.clinic_id,
          line_user_id,
          is_linked: true
        })
      })
    } catch (richMenuError) {
      console.error('リッチメニュー切り替えエラー:', richMenuError)
      // リッチメニューエラーは無視（後で手動切り替え可能）
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
        linked_at: linkage.linked_at,
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
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const searchParams = request.nextUrl.searchParams
    const line_user_id = searchParams.get('line_user_id')

    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDは必須です' },
        { status: 400 }
      )
    }

    // 連携患者一覧を取得
    const { data: linkages, error } = await supabase
      .from('line_patient_linkages')
      .select(`
        *,
        patients (
          id,
          patient_number,
          last_name,
          first_name,
          last_name_kana,
          first_name_kana,
          birth_date,
          gender,
          phone,
          email
        )
      `)
      .eq('line_user_id', line_user_id)
      .order('is_primary', { ascending: false })
      .order('linked_at', { ascending: false })

    if (error) {
      console.error('連携患者取得エラー:', error)
      return NextResponse.json(
        { error: '連携患者の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ linkages })

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
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const searchParams = request.nextUrl.searchParams
    const linkage_id = searchParams.get('linkage_id')

    if (!linkage_id) {
      return NextResponse.json(
        { error: '連携IDは必須です' },
        { status: 400 }
      )
    }

    // 連携を削除
    const { error } = await supabase
      .from('line_patient_linkages')
      .delete()
      .eq('id', linkage_id)

    if (error) {
      console.error('連携解除エラー:', error)
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
