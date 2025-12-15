import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// LINE Messaging APIのベースURL
const LINE_MESSAGING_API_BASE = 'https://api.line.me/v2/bot'

/**
 * POST /api/line/switch-rich-menu
 * LINE連携状態に応じてリッチメニューを切り替える
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, line_user_id, is_linked } = body

    console.log('🔄 switch-rich-menu: リクエスト受信', {
      clinic_id,
      line_user_id,
      is_linked
    })

    // バリデーション
    if (!clinic_id) {
      console.error('❌ clinic_id が未指定')
      return NextResponse.json(
        { error: 'クリニックIDは必須です' },
        { status: 400 }
      )
    }

    if (!line_user_id) {
      console.error('❌ line_user_id が未指定')
      return NextResponse.json(
        { error: 'LINE User IDは必須です' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.error('❌ supabaseAdmin が初期化されていません')
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      )
    }

    // LINE基本設定を取得（supabaseAdminを直接使用）
    console.log('📖 LINE設定を取得中...')
    const { data: lineSettings, error: lineError } = await supabaseAdmin
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinic_id)
      .eq('setting_key', 'line')
      .maybeSingle()

    if (lineError) {
      console.error('❌ LINE設定取得エラー:', lineError)
      return NextResponse.json(
        { error: `LINE設定取得エラー: ${lineError.message}` },
        { status: 500 }
      )
    }

    if (!lineSettings || !lineSettings.setting_value) {
      console.error('❌ LINE設定が見つかりません', { clinic_id })
      return NextResponse.json(
        { error: 'LINE設定が見つかりません' },
        { status: 404 }
      )
    }

    const line = lineSettings.setting_value
    const channelAccessToken = line.channel_access_token

    if (!channelAccessToken) {
      console.error('❌ Channel Access Token が未設定')
      return NextResponse.json(
        { error: 'LINE Channel Access Tokenが設定されていません' },
        { status: 400 }
      )
    }

    console.log('✅ LINE基本設定取得成功:', {
      hasToken: !!channelAccessToken,
      tokenPrefix: channelAccessToken?.substring(0, 20) + '...'
    })

    // リッチメニュー設定を取得
    console.log('📖 リッチメニュー設定を取得中...')
    const { data: richMenuSettings, error: richMenuError } = await supabaseAdmin
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinic_id)
      .eq('setting_key', 'line_rich_menu')
      .maybeSingle()

    if (richMenuError) {
      console.error('❌ リッチメニュー設定取得エラー:', richMenuError)
    }

    const richMenu = richMenuSettings?.setting_value || {}

    console.log('📊 リッチメニューID:', {
      registered: richMenu.line_registered_rich_menu_id,
      unregistered: richMenu.line_unregistered_rich_menu_id
    })

    // リッチメニューIDを決定
    const richMenuId = is_linked
      ? richMenu.line_registered_rich_menu_id    // 連携済み用
      : richMenu.line_unregistered_rich_menu_id  // 未連携用

    if (!richMenuId) {
      console.error('❌ リッチメニューIDが設定されていません', {
        is_linked,
        richMenu
      })
      return NextResponse.json(
        { error: `${is_linked ? '連携済み' : '未連携'}用のリッチメニューIDが設定されていません` },
        { status: 400 }
      )
    }

    console.log('🎯 使用するリッチメニューID:', richMenuId)

    // 既存のリッチメニューを解除
    console.log('🔓 既存リッチメニューを解除中...')
    try {
      const unlinkResponse = await fetch(
        `${LINE_MESSAGING_API_BASE}/user/${line_user_id}/richmenu`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${channelAccessToken}`
          }
        }
      )

      if (unlinkResponse.ok) {
        console.log('✅ 既存リッチメニュー解除成功')
      } else if (unlinkResponse.status === 404) {
        console.log('ℹ️ 既存リッチメニューなし（スキップ）')
      } else {
        const unlinkError = await unlinkResponse.text()
        console.warn('⚠️ リッチメニュー解除警告:', unlinkError)
      }
    } catch (unlinkError) {
      console.log('ℹ️ 既存リッチメニューなし（スキップ）:', unlinkError)
    }

    // 新しいリッチメニューを紐付け
    console.log('🔗 新しいリッチメニューを紐付け中...')
    const linkResponse = await fetch(
      `${LINE_MESSAGING_API_BASE}/user/${line_user_id}/richmenu/${richMenuId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${channelAccessToken}`
        }
      }
    )

    if (!linkResponse.ok) {
      const linkError = await linkResponse.text()
      console.error('❌ リッチメニュー紐付け失敗:', {
        status: linkResponse.status,
        error: linkError
      })
      return NextResponse.json(
        { error: `リッチメニュー紐付けエラー: ${linkError}` },
        { status: 500 }
      )
    }

    console.log('✅ リッチメニュー切り替え成功:', {
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
    console.error('❌ リッチメニュー切り替え例外:', error)
    return NextResponse.json(
      {
        error: 'リッチメニューの切り替えに失敗しました',
        message: error.message
      },
      { status: 500 }
    )
  }
}
