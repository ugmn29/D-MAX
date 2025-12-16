import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@line/bot-sdk'
import { generateRichMenuImage, RichMenuButton } from '@/lib/line/richmenu-image-generator'

interface RichMenuRequest {
  channelAccessToken: string
  buttons: RichMenuButton[]
  menuType?: 'registered' | 'unregistered'
  liffIds?: {
    initial_link?: string
    qr_code?: string
    family_register?: string
    appointments?: string
    web_booking?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RichMenuRequest = await request.json()
    const { channelAccessToken, buttons, menuType = 'registered', liffIds } = body

    console.log('=== Rich Menu API Request ===')
    console.log('Menu Type:', menuType)
    console.log('Buttons:', JSON.stringify(buttons, null, 2))
    console.log('LIFF IDs:', JSON.stringify(liffIds, null, 2))

    if (!channelAccessToken) {
      return NextResponse.json(
        { error: 'Channel Access Tokenが設定されていません' },
        { status: 400 }
      )
    }

    // clinic_idを取得（実際の実装では認証から取得）
    const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

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

    // LIFF IDを取得（設定画面の値 > 環境変数の順で優先）
    const liffIdQrCode = liffIds?.qr_code || process.env.NEXT_PUBLIC_LIFF_ID_QR_CODE
    const liffIdFamilyRegister = liffIds?.family_register || process.env.NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER
    const liffIdAppointments = liffIds?.appointments || process.env.NEXT_PUBLIC_LIFF_ID_APPOINTMENTS
    const liffIdWebBooking = liffIds?.web_booking || process.env.NEXT_PUBLIC_LIFF_ID_WEB_BOOKING
    const liffIdInitialLink = liffIds?.initial_link || process.env.NEXT_PUBLIC_LIFF_ID_INITIAL_LINK

    // 2. リッチメニューオブジェクトを作成
    let richMenu

    if (menuType === 'unregistered') {
      // 未連携ユーザー用リッチメニュー（3ボタン・横並び）
      richMenu = {
        size: {
          width: 2500,
          height: 843  // 1行分の高さ
        },
        selected: true,
        name: 'D-MAX Clinic Rich Menu (Unregistered)',
        chatBarText: 'メニュー',
        areas: [
          // 初回登録 (左) - LIFF URL
          {
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: {
              type: 'uri' as const,
              uri: liffIdInitialLink
                ? `https://liff.line.me/${liffIdInitialLink}`
                : (buttons[0]?.action === 'url' && buttons[0]?.url ? buttons[0].url : 'https://liff.line.me/2008448369-kGjrJLjO')
            }
          },
          // Webサイト (中央) - 外部URL
          {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: {
              type: 'uri' as const,
              uri: (buttons[1]?.action === 'url' && buttons[1]?.url) ? buttons[1].url : 'https://example.com'
            }
          },
          // お問合せ (右) - メッセージ送信
          {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: {
              type: 'message' as const,
              text: (buttons[2]?.action === 'message' && buttons[2]?.url) ? buttons[2].url : 'CONTACT_REQUEST'
            }
          }
        ]
      }
    } else {
      // 連携済みユーザー用リッチメニュー（6ボタン）
      richMenu = {
        size: {
          width: 2500,
          height: 1686
        },
        selected: true,
        name: 'D-MAX Clinic Rich Menu (Registered)',
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
            action: {
              type: 'uri' as const,
              uri: liffIdFamilyRegister
                ? `https://liff.line.me/${liffIdFamilyRegister}`
                : 'https://liff.line.me/family-register'
            }
          },
          // お問合せ (左列・3段目) - メッセージ送信
          {
            bounds: { x: 0, y: 1124, width: 833, height: 562 },
            action: { type: 'message' as const, text: buttons[4]?.url || 'CONTACT_REQUEST' }
          },
          // QRコード (中央上) - LIFF URL
          {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: {
              type: 'uri' as const,
              uri: liffIdQrCode
                ? `https://liff.line.me/${liffIdQrCode}`
                : 'https://liff.line.me/qr-code'
            }
          },
          // 予約確認 (右上) - LIFF URL
          {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: {
              type: 'uri' as const,
              uri: liffIdAppointments
                ? `https://liff.line.me/${liffIdAppointments}`
                : 'https://liff.line.me/appointments'
            }
          },
          // 予約を取る (中央下+右下の2マス分) - LIFF URL
          {
            bounds: { x: 833, y: 843, width: 1667, height: 843 },
            action: {
              type: 'uri' as const,
              uri: liffIdWebBooking
                ? `https://liff.line.me/${liffIdWebBooking}`
                : 'https://liff.line.me/web-booking'
            }
          }
        ]
      }
    }

    const richMenuId = await client.createRichMenu(richMenu)
    console.log('Created rich menu:', richMenuId)

    // 3. リッチメニュー画像を生成
    const imageBuffer = await generateRichMenuImage(buttons, menuType)

    // 4. 画像をアップロード
    await client.setRichMenuImage(richMenuId, imageBuffer, 'image/png')
    console.log('Uploaded rich menu image')

    // 5. リッチメニューIDをデータベースに保存
    const { getSupabaseClient } = await import('@/lib/utils/supabase-client')
    const supabase = getSupabaseClient()

    const columnName = menuType === 'registered'
      ? 'line_registered_rich_menu_id'
      : 'line_unregistered_rich_menu_id'

    console.log(`データベース保存開始: clinic_id=${DEMO_CLINIC_ID}, ${columnName}=${richMenuId}`)

    // 既存レコードをチェック（clinic_id + setting_keyの組み合わせ）
    const { data: existingData } = await supabase
      .from('clinic_settings')
      .select('clinic_id')
      .eq('clinic_id', DEMO_CLINIC_ID)
      .eq('setting_key', 'line_rich_menu')
      .maybeSingle()

    let saveResult
    if (existingData) {
      // 既存レコードがあればUPDATE
      console.log('既存レコードを更新します')
      const { data, error } = await supabase
        .from('clinic_settings')
        .update({ [columnName]: richMenuId })
        .eq('clinic_id', DEMO_CLINIC_ID)
        .eq('setting_key', 'line_rich_menu')
        .select()

      if (error) {
        console.error('データベース更新エラー:', error)
        throw new Error(`Failed to update rich menu ID: ${error.message}`)
      }
      saveResult = data
    } else {
      // 新規レコードを作成
      console.log('新規レコードを作成します')
      const { data, error } = await supabase
        .from('clinic_settings')
        .insert({
          clinic_id: DEMO_CLINIC_ID,
          setting_key: 'line_rich_menu', // NOT NULL制約のため必須
          [columnName]: richMenuId
        })
        .select()

      if (error) {
        console.error('データベース挿入エラー:', error)
        throw new Error(`Failed to insert rich menu ID: ${error.message}`)
      }
      saveResult = data
    }

    console.log(`リッチメニューID保存完了: ${columnName} = ${richMenuId}`)
    console.log('保存結果:', saveResult)

    // 6. デフォルトリッチメニューとして設定
    await client.setDefaultRichMenu(richMenuId)
    console.log('Set as default rich menu')
    console.log('注意: デフォルトリッチメニューは全ユーザーに適用されます。')

    return NextResponse.json({
      success: true,
      richMenuId,
      menuType,
      message: `${menuType === 'registered' ? '連携済み' : '未連携'}用リッチメニューを作成しました`,
      debug: {
        existingRecordFound: !!existingData,
        saveResult: saveResult,
        columnName: columnName,
        clinicId: DEMO_CLINIC_ID
      }
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
