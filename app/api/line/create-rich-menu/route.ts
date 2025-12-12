import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'

/**
 * POST /api/line/create-rich-menu
 * リッチメニューをLINE Messaging APIに作成・登録
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      name,
      chatBarText,
      areas,
      size,
      selected = false
    } = body

    console.log('🎨 リッチメニュー作成開始:', { clinic_id, name, chatBarText })

    // LINE設定を取得
    const lineSettings = await getLineSettings(clinic_id)
    const channelAccessToken = lineSettings.channelAccessToken

    // リッチメニューオブジェクトを作成
    const richMenu = {
      size: size || {
        width: 2500,
        height: 1686
      },
      selected: selected,
      name: name,
      chatBarText: chatBarText,
      areas: areas.map((area: any) => ({
        bounds: {
          x: area.bounds.x,
          y: area.bounds.y,
          width: area.bounds.width,
          height: area.bounds.height
        },
        action: area.action
      }))
    }

    console.log('📊 リッチメニュー定義:', JSON.stringify(richMenu, null, 2))

    // LINE Messaging APIでリッチメニューを作成
    const createResponse = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(richMenu)
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      console.error('❌ リッチメニュー作成失敗:', error)
      throw new Error(`LINE API Error: ${JSON.stringify(error)}`)
    }

    const createResult = await createResponse.json()
    const richMenuId = createResult.richMenuId

    console.log('✅ リッチメニュー作成成功:', richMenuId)

    return NextResponse.json({
      success: true,
      richMenuId: richMenuId,
      message: 'リッチメニューを作成しました'
    })

  } catch (error) {
    console.error('❌ リッチメニュー作成エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
