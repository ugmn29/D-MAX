import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'

/**
 * GET /api/line/list-rich-menus
 * 既存のリッチメニュー一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    console.log('📋 リッチメニュー一覧取得開始:', clinicId)

    const lineSettings = await getLineSettings(clinicId)
    const channelAccessToken = lineSettings.channelAccessToken

    // LINE APIでリッチメニュー一覧を取得
    const response = await fetch('https://api.line.me/v2/bot/richmenu/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`LINE API Error: ${JSON.stringify(error)}`)
    }

    const result = await response.json()

    console.log('✅ リッチメニュー一覧取得成功:', result)

    return NextResponse.json({
      success: true,
      richmenus: result.richmenus || []
    })

  } catch (error) {
    console.error('❌ リッチメニュー一覧取得エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
