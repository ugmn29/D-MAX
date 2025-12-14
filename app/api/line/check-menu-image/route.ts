import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'

/**
 * GET /api/line/check-menu-image?rich_menu_id=xxx
 * リッチメニューに画像がアップロードされているか確認
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const richMenuId = searchParams.get('rich_menu_id')

    if (!richMenuId) {
      return NextResponse.json(
        { error: 'rich_menu_id is required' },
        { status: 400 }
      )
    }

    const clinicId = '11111111-1111-1111-1111-111111111111'
    const lineSettings = await getLineSettings(clinicId)

    // リッチメニューの詳細を取得
    const menuResponse = await fetch(
      `https://api.line.me/v2/bot/richmenu/${richMenuId}`,
      {
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    if (!menuResponse.ok) {
      const error = await menuResponse.json()
      return NextResponse.json({
        success: false,
        error: 'リッチメニューが見つかりません',
        details: error
      }, { status: 404 })
    }

    const menuData = await menuResponse.json()

    // 画像の存在確認（HEAD リクエスト）
    const imageResponse = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    const hasImage = imageResponse.ok

    return NextResponse.json({
      success: true,
      richMenuId,
      menuData: {
        name: menuData.name,
        chatBarText: menuData.chatBarText,
        selected: menuData.selected,
        areas: menuData.areas?.length || 0
      },
      hasImage,
      message: hasImage
        ? '✅ 画像がアップロードされています'
        : '❌ 画像がアップロードされていません（これが原因でメニューが表示されない可能性があります）'
    })

  } catch (error) {
    console.error('リッチメニュー画像確認エラー:', error)
    return NextResponse.json(
      {
        error: 'Failed to check rich menu image',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
