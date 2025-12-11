import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'
import { generateInvitationCode, calculateExpiration } from '@/lib/line/invitation-code'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

/**
 * POST /api/line/invitation-codes
 * LINE連携用の招待コードを発行
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    // リクエストボディを取得
    const body = await request.json()
    const { patient_id, clinic_id, expires_in_days = 30, created_by } = body

    // バリデーション
    if (!patient_id) {
      return NextResponse.json(
        { error: '患者IDは必須です' },
        { status: 400 }
      )
    }

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'クリニックIDは必須です' },
        { status: 400 }
      )
    }

    if (!created_by) {
      return NextResponse.json(
        { error: '作成者IDは必須です' },
        { status: 400 }
      )
    }

    // 患者が存在するか確認（patient_idはTEXT型）
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, clinic_id, last_name, first_name')
      .eq('id', patient_id)
      .eq('clinic_id', clinic_id)
      .single()

    if (patientError || !patient) {
      console.error('患者が見つかりません:', { patient_id, clinic_id, error: patientError })
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    // 既存の有効な招待コードがあるかチェック
    const { data: existingCode } = await supabase
      .from('line_invitation_codes')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingCode) {
      // 既存の有効なコードを返す
      return NextResponse.json({
        invitation_code: existingCode.invitation_code,
        expires_at: existingCode.expires_at,
        is_new: false,
      })
    }

    // 新しい招待コードを生成（重複チェック付き）
    let invitation_code: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      invitation_code = generateInvitationCode()

      // コードの重複チェック
      const { data: duplicateCheck } = await supabase
        .from('line_invitation_codes')
        .select('id')
        .eq('invitation_code', invitation_code)
        .single()

      if (!duplicateCheck) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: '招待コードの生成に失敗しました。再度お試しください。' },
        { status: 500 }
      )
    }

    // 有効期限を計算
    const expires_at = calculateExpiration(expires_in_days)

    // 招待コードをデータベースに保存
    const { data: newCode, error: insertError } = await supabase
      .from('line_invitation_codes')
      .insert({
        clinic_id,
        patient_id,
        invitation_code: invitation_code!,
        expires_at: expires_at.toISOString(),
        created_by,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('招待コード保存エラー:', insertError)
      return NextResponse.json(
        { error: '招待コードの保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      invitation_code: newCode.invitation_code,
      expires_at: newCode.expires_at,
      is_new: true,
    })

  } catch (error) {
    console.error('招待コード発行エラー:', error)
    return NextResponse.json(
      { error: '招待コードの発行に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/line/invitation-codes?patient_id=xxx
 * 患者の招待コード一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const patient_id = searchParams.get('patient_id')

    if (!patient_id) {
      return NextResponse.json(
        { error: '患者IDは必須です' },
        { status: 400 }
      )
    }

    // 患者の招待コード一覧を取得
    const { data: codes, error } = await supabase
      .from('line_invitation_codes')
      .select('*')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('招待コード取得エラー:', error)
      return NextResponse.json(
        { error: '招待コードの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ codes })

  } catch (error) {
    console.error('招待コード取得エラー:', error)
    return NextResponse.json(
      { error: '招待コードの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/line/invitation-codes?id=xxx
 * 招待コードを無効化（期限切れ扱い）
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: '招待コードIDは必須です' },
        { status: 400 }
      )
    }

    // 招待コードを期限切れに更新
    const { error } = await supabase
      .from('line_invitation_codes')
      .update({ status: 'expired' })
      .eq('id', id)

    if (error) {
      console.error('招待コード無効化エラー:', error)
      return NextResponse.json(
        { error: '招待コードの無効化に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('招待コード無効化エラー:', error)
    return NextResponse.json(
      { error: '招待コードの無効化に失敗しました' },
      { status: 500 }
    )
  }
}
