import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@line/bot-sdk'
import { generateRichMenuImage, RichMenuButton } from '@/lib/line/richmenu-image-generator'

interface RichMenuRequest {
  channelAccessToken: string
  buttons: RichMenuButton[]
}

export async function POST(request: NextRequest) {
  try {
    const body: RichMenuRequest = await request.json()
    const { channelAccessToken, buttons } = body

    if (!channelAccessToken) {
      return NextResponse.json(
        { error: 'Channel Access Tokenが設定されていません' },
        { status: 400 }
      )
    }

    // LINE Bot クライアント初期化
    const client = new Client({
      channelAccessToken: channelAccessToken
    })

    // 1. 既存のデフォルトリッチメニューを削除
    try {
      const defaultRichMenuId = await client.getDefaultRichMenuId()
      if (defaultRichMenuId) {
        await client.deleteRichMenu(defaultRichMenuId)
        console.log('Deleted existing default rich menu:', defaultRichMenuId)
      }
    } catch (error) {
      console.log('No existing default rich menu to delete')
    }

    // 2. リッチメニューオブジェクトを作成
    const richMenu = {
      size: {
        width: 2500,
        height: 1686
      },
      selected: true,
      name: 'D-MAX Clinic Rich Menu',
      chatBarText: 'メニュー',
      areas: [
        // Webサイト (左列・1段目) - 外部URL
        {
          bounds: { x: 0, y: 0, width: 833, height: 542 },
          action: { type: 'uri' as const, uri: buttons[3]?.url || 'https://example.com' }
        },
        // 家族登録 (左列・2段目) - LIFF URL
        {
          bounds: { x: 0, y: 562, width: 833, height: 542 },
          action: { type: 'uri' as const, uri: buttons[2]?.url || 'https://liff.line.me/family-register' }
        },
        // お問合せ (左列・3段目) - メッセージ送信
        {
          bounds: { x: 0, y: 1124, width: 833, height: 562 },
          action: { type: 'message' as const, text: 'CONTACT_REQUEST' }
        },
        // QRコード (中央上) - メッセージで画像送信
        {
          bounds: { x: 833, y: 0, width: 834, height: 843 },
          action: { type: 'message' as const, text: 'QR_CODE_REQUEST' }
        },
        // 予約確認 (右上) - メッセージで予約情報表示
        {
          bounds: { x: 1667, y: 0, width: 833, height: 843 },
          action: { type: 'message' as const, text: 'APPOINTMENT_CHECK' }
        },
        // 予約を取る (中央下+右下の2マス分) - 新規予約URL
        {
          bounds: { x: 833, y: 843, width: 1667, height: 843 },
          action: { type: 'uri' as const, uri: buttons[5]?.url || 'https://liff.line.me/appointment' }
        }
      ]
    }

    const richMenuId = await client.createRichMenu(richMenu)
    console.log('Created rich menu:', richMenuId)

    // 3. リッチメニュー画像を生成
    const imageBuffer = await generateRichMenuImage(buttons)

    // 4. 画像をアップロード
    await client.setRichMenuImage(richMenuId, imageBuffer, 'image/png')
    console.log('Uploaded rich menu image')

    // 5. デフォルトリッチメニューとして設定
    await client.setDefaultRichMenu(richMenuId)
    console.log('Set as default rich menu')

    return NextResponse.json({
      success: true,
      richMenuId,
      message: 'リッチメニューをLINE公式アカウントに反映しました'
    })
  } catch (error) {
    console.error('Error creating rich menu:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'リッチメニューの作成に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}

// 現在のリッチメニュー情報を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelAccessToken = searchParams.get('channelAccessToken')

    if (!channelAccessToken) {
      return NextResponse.json(
        { error: 'Channel Access Tokenが必要です' },
        { status: 400 }
      )
    }

    const client = new Client({ channelAccessToken })

    try {
      const defaultRichMenuId = await client.getDefaultRichMenuId()
      if (defaultRichMenuId) {
        const richMenu = await client.getRichMenu(defaultRichMenuId)
        return NextResponse.json({
          exists: true,
          richMenuId: defaultRichMenuId,
          richMenu
        })
      }
    } catch (error) {
      console.log('No default rich menu found')
    }

    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error('Error getting rich menu:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'リッチメニュー情報の取得に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}
