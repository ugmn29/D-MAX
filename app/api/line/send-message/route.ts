import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings, sendLineMessage } from '@/lib/line/messaging'

/**
 * POST /api/line/send-message
 * LINEメッセージを送信
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, line_user_id, messages } = body

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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'メッセージは必須です' },
        { status: 400 }
      )
    }

    // LINE設定を取得
    const lineSettings = await getLineSettings(clinic_id)

    // メッセージを送信
    await sendLineMessage({
      channelAccessToken: lineSettings.channelAccessToken,
      to: line_user_id,
      messages
    })

    console.log('LINE送信成功:', { line_user_id, messageCount: messages.length })

    return NextResponse.json({
      success: true,
      message: 'メッセージを送信しました'
    })

  } catch (error: any) {
    console.error('LINE送信エラー:', error)
    return NextResponse.json(
      {
        error: 'メッセージの送信に失敗しました',
        message: error.message
      },
      { status: 500 }
    )
  }
}
