import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { getLineSettings, linkRichMenu, unlinkRichMenu } from '@/lib/line/messaging'

/**
 * POST /api/line/switch-rich-menu
 * LINE連携状態に応じてリッチメニューを切り替える
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { clinic_id, line_user_id, is_linked } = body

    // バリデーション
    if (!clinic_id) {
      return NextResponse.json(
        { error: 'クリニックIDは必須です' },
        { status: 400 }
      )
    }

    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDは必須です' },
        { status: 400 }
      )
    }

    // LINE設定を取得
    const lineSettings = await getLineSettings(clinic_id)

    // リッチメニューIDを決定
    const richMenuId = is_linked
      ? lineSettings.registeredRichMenuId    // 連携済み用
      : lineSettings.unregisteredRichMenuId  // 未連携用

    if (!richMenuId) {
      return NextResponse.json(
        { error: 'リッチメニューIDが設定されていません' },
        { status: 400 }
      )
    }

    // 既存のリッチメニューを解除
    try {
      await unlinkRichMenu({
        channelAccessToken: lineSettings.channelAccessToken,
        userId: line_user_id
      })
    } catch (error) {
      console.log('既存リッチメニューなし（スキップ）')
    }

    // 新しいリッチメニューを紐付け
    await linkRichMenu({
      channelAccessToken: lineSettings.channelAccessToken,
      userId: line_user_id,
      richMenuId
    })

    console.log('リッチメニュー切り替え成功:', {
      line_user_id,
      is_linked,
      rich_menu_id: richMenuId
    })

    return NextResponse.json({
      success: true,
      message: 'リッチメニューを切り替えました',
      rich_menu_id: richMenuId
    })

  } catch (error: any) {
    console.error('リッチメニュー切り替えエラー:', error)
    return NextResponse.json(
      {
        error: 'リッチメニューの切り替えに失敗しました',
        message: error.message
      },
      { status: 500 }
    )
  }
}
