import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'

/**
 * GET /api/line/get-default-menu
 * デフォルトリッチメニューIDを取得
 */
export async function GET(request: NextRequest) {
  try {
    const clinicId = '11111111-1111-1111-1111-111111111111'
    const lineSettings = await getLineSettings(clinicId)

    // デフォルトリッチメニューIDを取得
    const response = await fetch(
      'https://api.line.me/v2/bot/user/all/richmenu',
      {
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    if (response.status === 404) {
      return NextResponse.json({
        success: true,
        defaultRichMenuId: null,
        message: 'デフォルトリッチメニューは設定されていません'
      })
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to get default rich menu: ${JSON.stringify(error)}`)
    }

    const result = await response.json()

    // メニューの詳細を取得
    const menuResponse = await fetch(
      `https://api.line.me/v2/bot/richmenu/${result.richMenuId}`,
      {
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    const menuData = await menuResponse.json()

    // 画像の存在確認
    const imageResponse = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${result.richMenuId}/content`,
      {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    return NextResponse.json({
      success: true,
      defaultRichMenuId: result.richMenuId,
      menuData: {
        name: menuData.name,
        chatBarText: menuData.chatBarText,
        selected: menuData.selected,
        areas: menuData.areas?.length || 0
      },
      hasImage: imageResponse.ok,
      message: `デフォルトメニュー: ${menuData.name}`
    })

  } catch (error) {
    console.error('デフォルトリッチメニュー取得エラー:', error)
    return NextResponse.json(
      {
        error: 'Failed to get default rich menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
