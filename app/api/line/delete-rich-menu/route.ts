import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'

/**
 * POST /api/line/delete-rich-menu
 * リッチメニューを削除
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, rich_menu_id } = body

    if (!clinic_id || !rich_menu_id) {
      return NextResponse.json(
        { error: 'clinic_id and rich_menu_id are required' },
        { status: 400 }
      )
    }

    const lineSettings = await getLineSettings(clinic_id)

    // リッチメニューを削除
    const response = await fetch(
      `https://api.line.me/v2/bot/richmenu/${rich_menu_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to delete rich menu: ${JSON.stringify(error)}`)
    }

    return NextResponse.json({
      success: true,
      message: 'リッチメニューを削除しました',
      richMenuId: rich_menu_id
    })

  } catch (error) {
    console.error('リッチメニュー削除エラー:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete rich menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
