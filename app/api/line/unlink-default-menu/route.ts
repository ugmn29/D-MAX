import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'

/**
 * POST /api/line/unlink-default-menu
 * デフォルトリッチメニューを解除
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id } = body

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const lineSettings = await getLineSettings(clinic_id)

    // デフォルトリッチメニューを解除
    const response = await fetch(
      'https://api.line.me/v2/bot/user/all/richmenu',
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to unlink default menu: ${JSON.stringify(error)}`)
    }

    return NextResponse.json({
      success: true,
      message: 'デフォルトリッチメニューを解除しました'
    })

  } catch (error) {
    console.error('デフォルトメニュー解除エラー:', error)
    return NextResponse.json(
      {
        error: 'Failed to unlink default menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
