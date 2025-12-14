import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'

/**
 * POST /api/line/set-default-rich-menu
 * デフォルトリッチメニューを設定（未連携ユーザー用）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, rich_menu_id } = body

    if (!rich_menu_id) {
      return NextResponse.json(
        { error: 'rich_menu_id is required' },
        { status: 400 }
      )
    }

    const lineSettings = await getLineSettings(clinic_id)

    // LINE APIでデフォルトリッチメニューを設定
    const response = await fetch(
      `https://api.line.me/v2/bot/user/all/richmenu/${rich_menu_id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to set default rich menu: ${JSON.stringify(error)}`)
    }

    return NextResponse.json({
      success: true,
      message: 'デフォルトリッチメニューを設定しました',
      richMenuId: rich_menu_id
    })

  } catch (error) {
    console.error('デフォルトリッチメニュー設定エラー:', error)
    return NextResponse.json(
      {
        error: 'Failed to set default rich menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
