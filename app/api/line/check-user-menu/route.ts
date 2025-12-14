import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'

/**
 * GET /api/line/check-user-menu?line_user_id=xxx
 * 指定したLINEユーザーに現在紐付いているリッチメニューを確認
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lineUserId = searchParams.get('line_user_id')

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'line_user_id is required' },
        { status: 400 }
      )
    }

    // デモクリニックIDを使用（本番環境ではclinic_idをパラメータから取得すべき）
    const clinicId = '11111111-1111-1111-1111-111111111111'

    const lineSettings = await getLineSettings(clinicId)

    // LINE APIで現在紐付いているリッチメニューを確認
    const response = await fetch(
      `https://api.line.me/v2/bot/user/${lineUserId}/richmenu`,
      {
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    if (response.status === 404) {
      return NextResponse.json({
        success: true,
        lineUserId,
        currentRichMenuId: null,
        message: 'このユーザーにはリッチメニューが紐付いていません',
        settings: {
          registeredMenuId: lineSettings.registeredRichMenuId,
          unregisteredMenuId: lineSettings.unregisteredRichMenuId
        }
      })
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`LINE API Error: ${JSON.stringify(error)}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      lineUserId,
      currentRichMenuId: result.richMenuId,
      expectedMenuId: lineSettings.registeredRichMenuId,
      isCorrect: result.richMenuId === lineSettings.registeredRichMenuId,
      settings: {
        registeredMenuId: lineSettings.registeredRichMenuId,
        unregisteredMenuId: lineSettings.unregisteredRichMenuId
      },
      message: result.richMenuId === lineSettings.registeredRichMenuId
        ? '✅ 正しいリッチメニューが紐付いています'
        : '⚠️ 期待と異なるリッチメニューが紐付いています'
    })

  } catch (error) {
    console.error('ユーザーリッチメニュー確認エラー:', error)
    return NextResponse.json(
      {
        error: 'Failed to check user rich menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
