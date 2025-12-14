import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/line/unlink-patient
 * 患者とLINEアカウントの連携を解除
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin

    if (!supabase) {
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { line_user_id, patient_id } = body

    // バリデーション
    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDは必須です' },
        { status: 400 }
      )
    }

    if (!patient_id) {
      return NextResponse.json(
        { error: '患者IDは必須です' },
        { status: 400 }
      )
    }

    // 連携情報を取得
    const { data: linkage, error: linkageError } = await supabase
      .from('line_patient_linkages')
      .select('*')
      .eq('line_user_id', line_user_id)
      .eq('patient_id', patient_id)
      .single()

    if (linkageError || !linkage) {
      return NextResponse.json(
        { error: '連携情報が見つかりません' },
        { status: 404 }
      )
    }

    // 連携を削除
    const { error: deleteError } = await supabase
      .from('line_patient_linkages')
      .delete()
      .eq('id', linkage.id)

    if (deleteError) {
      console.error('連携解除エラー:', deleteError)
      return NextResponse.json(
        { error: '連携解除に失敗しました' },
        { status: 500 }
      )
    }

    // 残りの連携を確認
    const { data: remainingLinkages } = await supabase
      .from('line_patient_linkages')
      .select('id')
      .eq('line_user_id', line_user_id)

    const hasRemainingLinks = remainingLinkages && remainingLinkages.length > 0

    // リッチメニューを切り替え
    try {
      console.log('🔄 リッチメニュー切り替え開始:', {
        clinic_id: linkage.clinic_id,
        line_user_id,
        is_linked: hasRemainingLinks
      })

      const richMenuResponse = await fetch(`${request.nextUrl.origin}/api/line/switch-rich-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: linkage.clinic_id,
          line_user_id,
          is_linked: hasRemainingLinks  // 他の連携が残っていれば連携済みメニューのまま
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
    }

    return NextResponse.json({
      success: true,
      message: '連携を解除しました',
      has_remaining_links: hasRemainingLinks
    })

  } catch (error) {
    console.error('連携解除エラー:', error)
    return NextResponse.json(
      { error: '連携解除に失敗しました' },
      { status: 500 }
    )
  }
}
