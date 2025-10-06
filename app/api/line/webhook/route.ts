import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  linkLineUserToPatient,
  switchPatient,
  getLineUserLinks,
  advanceConversationState,
  getConversationState
} from '@/lib/api/line'
import { processQRCodeCheckIn } from '@/lib/api/line-qr'
import { getNotificationSettings } from '@/lib/api/notification-settings'

// LINE Messaging APIのイベント型
interface LineEvent {
  type: string
  timestamp: number
  source: {
    type: string
    userId: string
  }
  replyToken: string
  message?: {
    type: string
    id: string
    text?: string
  }
  postback?: {
    data: string
  }
}

interface LineWebhookBody {
  destination: string
  events: LineEvent[]
}

/**
 * LINE署名の検証
 */
function validateSignature(body: string, signature: string, channelSecret: string): boolean {
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64')
  return hash === signature
}

/**
 * LINEメッセージを送信
 */
async function sendLineMessage(
  replyToken: string,
  messages: any[],
  channelAccessToken: string
) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      replyToken,
      messages
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('LINE message send error:', error)
    throw new Error('Failed to send LINE message')
  }
}

/**
 * テキストメッセージを作成
 */
function createTextMessage(text: string) {
  return {
    type: 'text',
    text
  }
}

/**
 * 患者認証メッセージ（診察券番号 + 生年月日）
 */
function createPatientAuthMessage() {
  return createTextMessage(
    '患者様の認証を行います。\n\n' +
    '以下の形式で入力してください：\n' +
    '診察券番号 生年月日（8桁）\n\n' +
    '例：123456 19900101'
  )
}

/**
 * 患者選択メッセージ
 */
function createPatientSelectMessage(links: any[]) {
  const patientList = links
    .map((link, index) => `${index + 1}. ${link.patient_name}`)
    .join('\n')

  return createTextMessage(
    `登録されている患者様：\n\n${patientList}\n\n` +
    '番号を選択してください（例：1）'
  )
}

/**
 * メインメニューメッセージ
 */
function createMainMenuMessage(patientName: string) {
  return createTextMessage(
    `${patientName}様\n\n` +
    'ご利用可能なメニュー：\n' +
    '1. 予約確認\n' +
    '2. 患者切り替え\n' +
    '3. QRコードスキャン\n\n' +
    '番号を選択してください'
  )
}

/**
 * POST: LINE Webhook
 */
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text()
    const signature = request.headers.get('x-line-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 401 })
    }

    // 通知設定から認証情報を取得（実際の実装ではclinic_idを適切に取得）
    const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000000'
    const settings = await getNotificationSettings(DEMO_CLINIC_ID)

    if (!settings?.line.enabled || !settings.line.channel_secret) {
      return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })
    }

    // 署名検証
    if (!validateSignature(bodyText, signature, settings.line.channel_secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body: LineWebhookBody = JSON.parse(bodyText)

    // イベント処理
    for (const event of body.events) {
      if (event.type === 'message' && event.message?.type === 'text') {
        await handleTextMessage(event, settings.line.channel_access_token, DEMO_CLINIC_ID)
      } else if (event.type === 'postback') {
        await handlePostback(event, settings.line.channel_access_token, DEMO_CLINIC_ID)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LINE webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * テキストメッセージの処理
 */
async function handleTextMessage(event: LineEvent, channelAccessToken: string, clinicId: string) {
  const lineUserId = event.source.userId
  const text = event.message?.text || ''

  // 会話状態を取得
  const state = await getConversationState(lineUserId)

  // 既存のLINE連携があるかチェック
  const existingLinks = await getLineUserLinks(lineUserId, clinicId)

  if (!state || state.state === 'initial' || state.state === 'idle') {
    // 既に連携がある場合は、自動的に認証済み状態にする
    if (existingLinks.length > 0) {
      const primaryLink = existingLinks.find(link => link.is_primary) || existingLinks[0]
      await advanceConversationState(lineUserId, 'authenticated', {
        current_patient_id: primaryLink.patient_id,
        selectedPatientId: primaryLink.patient_id
      })

      await sendLineMessage(
        event.replyToken,
        [createTextMessage(`こんにちは、${primaryLink.nickname || '患者'}様\n\nリッチメニューからご利用ください。`)],
        channelAccessToken
      )
      return
    }

    // 初回または未認証状態 - 患者認証を開始
    await advanceConversationState(lineUserId, 'awaiting_patient_auth', {})
    await sendLineMessage(
      event.replyToken,
      [createPatientAuthMessage()],
      channelAccessToken
    )
    return
  }

  if (state.state === 'awaiting_patient_auth') {
    // 患者認証処理（診察券番号 + 生年月日）
    const parts = text.trim().split(/\s+/)
    if (parts.length !== 2) {
      await sendLineMessage(
        event.replyToken,
        [createTextMessage('形式が正しくありません。\n\n診察券番号 生年月日（8桁）の形式で入力してください。\n例：123456 19900101')],
        channelAccessToken
      )
      return
    }

    const [patientNumber, birthdate] = parts

    try {
      const link = await linkLineUserToPatient({
        line_user_id: lineUserId,
        clinic_id: clinicId,
        patient_number: patientNumber,
        birthdate: birthdate
      })

      await advanceConversationState(lineUserId, 'authenticated', {
        current_patient_id: link.patient_id,
        selectedPatientId: link.patient_id  // 後方互換性のため
      })

      await sendLineMessage(
        event.replyToken,
        [createTextMessage(`認証が完了しました。\n\nこんにちは、${link.patient_name}様`)],
        channelAccessToken
      )
    } catch (error) {
      await sendLineMessage(
        event.replyToken,
        [createTextMessage('認証に失敗しました。\n診察券番号と生年月日をご確認ください。')],
        channelAccessToken
      )
    }
    return
  }

  if (state.state === 'authenticated') {
    // リッチメニューボタンからの特殊コマンドをチェック
    if (text === 'QR_CODE_REQUEST') {
      // QRコード表示リクエスト
      await handleQRCodeRequest(event, state, channelAccessToken, clinicId)
      return
    } else if (text === 'APPOINTMENT_CHECK') {
      // 予約確認リクエスト
      await handleAppointmentCheck(event, state, channelAccessToken, clinicId)
      return
    } else if (text === 'CONTACT_REQUEST') {
      // お問い合わせリクエスト
      await handleContactRequest(event, channelAccessToken)
      return
    }

    // 認証済み - メニュー選択
    const menuNumber = parseInt(text.trim())

    if (menuNumber === 1) {
      // 予約確認
      await sendLineMessage(
        event.replyToken,
        [createTextMessage('予約確認機能は準備中です。')],
        channelAccessToken
      )
    } else if (menuNumber === 2) {
      // 患者切り替え
      const links = await getLineUserLinks(lineUserId, clinicId)
      if (links.length > 1) {
        await advanceConversationState(lineUserId, 'selecting_patient', {})
        await sendLineMessage(
          event.replyToken,
          [createPatientSelectMessage(links)],
          channelAccessToken
        )
      } else {
        await sendLineMessage(
          event.replyToken,
          [createTextMessage('他の患者様は登録されていません。')],
          channelAccessToken
        )
      }
    } else if (menuNumber === 3) {
      // QRコードスキャン案内
      await sendLineMessage(
        event.replyToken,
        [createTextMessage('クリニックのQRコードをスキャンしてください。')],
        channelAccessToken
      )
    } else {
      // QRトークンかチェック
      if (text.length > 20) {
        // QRコードトークンの可能性
        const result = await processQRCodeCheckIn(text)
        if (result.success) {
          await sendLineMessage(
            event.replyToken,
            [createTextMessage(`受付が完了しました。\n\n${result.patient?.name}様\n予約時間：${result.appointment?.start_time}`)],
            channelAccessToken
          )
        } else {
          await sendLineMessage(
            event.replyToken,
            [createTextMessage('QRコードが無効です。受付でお声がけください。')],
            channelAccessToken
          )
        }
      } else {
        await sendLineMessage(
          event.replyToken,
          [createTextMessage('メニュー番号（1〜3）を選択してください。')],
          channelAccessToken
        )
      }
    }
    return
  }

  if (state.state === 'selecting_patient') {
    // 患者選択処理
    const selectedNumber = parseInt(text.trim())
    const links = await getLineUserLinks(lineUserId, clinicId)

    if (selectedNumber >= 1 && selectedNumber <= links.length) {
      const selectedLink = links[selectedNumber - 1]
      await switchPatient(lineUserId, selectedLink.patient_id)
      await advanceConversationState(lineUserId, 'authenticated', {
        current_patient_id: selectedLink.patient_id,
        selectedPatientId: selectedLink.patient_id  // 後方互換性のため
      })

      await sendLineMessage(
        event.replyToken,
        [createTextMessage(`${selectedLink.patient_name}様に切り替えました。`)],
        channelAccessToken
      )
    } else {
      await sendLineMessage(
        event.replyToken,
        [createTextMessage('無効な番号です。もう一度選択してください。')],
        channelAccessToken
      )
    }
    return
  }
}

/**
 * ポストバックの処理
 */
async function handlePostback(event: LineEvent, channelAccessToken: string, clinicId: string) {
  // 将来的にリッチメニューのボタン等で使用
  const data = event.postback?.data || ''

  await sendLineMessage(
    event.replyToken,
    [createTextMessage('この機能は準備中です。')],
    channelAccessToken
  )
}

/**
 * QRコード表示リクエストを処理
 */
async function handleQRCodeRequest(
  event: LineEvent,
  state: any,
  channelAccessToken: string,
  clinicId: string
) {
  const { getSupabaseClient } = await import('@/lib/utils/supabase-client')

  try {
    const patientId = state.context?.current_patient_id
    if (!patientId) {
      await sendLineMessage(
        event.replyToken,
        [createTextMessage('患者情報が見つかりません。')],
        channelAccessToken
      )
      return
    }

    // 患者情報を取得
    const client = getSupabaseClient()
    const { data: patient } = await client
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (!patient) {
      await sendLineMessage(
        event.replyToken,
        [createTextMessage('患者情報が見つかりません。')],
        channelAccessToken
      )
      return
    }

    // QRコード画像APIを呼び出して画像URLを取得
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const qrResponse = await fetch(`${baseUrl}/api/line/qr-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        clinic_id: clinicId,
        line_user_id: event.source.userId
      })
    })

    if (!qrResponse.ok) {
      throw new Error('QRコード画像の生成に失敗しました')
    }

    const { imageUrl, isDataUrl } = await qrResponse.json()

    // LINEメッセージとして送信
    const messages: any[] = [
      createTextMessage(`${patient.name}様の診察券QRコード\n\n受付でこのQRコードをスキャンしてください。\n有効期限: 5分`)
    ]

    // データURLの場合とHTTPS URLの場合で処理を分ける
    if (!isDataUrl && imageUrl.startsWith('http')) {
      messages.push({
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl
      })
    } else {
      // データURLの場合はテキストで案内
      messages.push(
        createTextMessage('QRコード画像の準備中です。しばらくしてから再度お試しください。')
      )
    }

    await sendLineMessage(event.replyToken, messages, channelAccessToken)
  } catch (error) {
    console.error('QRコード生成エラー:', error)
    await sendLineMessage(
      event.replyToken,
      [createTextMessage('QRコードの生成に失敗しました。')],
      channelAccessToken
    )
  }
}

/**
 * 予約確認リクエストを処理
 */
async function handleAppointmentCheck(
  event: LineEvent,
  state: any,
  channelAccessToken: string,
  clinicId: string
) {
  const { getSupabaseClient } = await import('@/lib/utils/supabase-client')

  try {
    const patientId = state.context?.current_patient_id
    if (!patientId) {
      await sendLineMessage(
        event.replyToken,
        [createTextMessage('患者情報が見つかりません。')],
        channelAccessToken
      )
      return
    }

    // 今後の予約を取得
    const client = getSupabaseClient()
    const { data: appointments } = await client
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(5)

    if (!appointments || appointments.length === 0) {
      await sendLineMessage(
        event.replyToken,
        [createTextMessage('予約はありません。')],
        channelAccessToken
      )
      return
    }

    // 予約情報をフォーマット
    const appointmentList = appointments.map((apt, index) => {
      const date = new Date(apt.start_time)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}(${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`
      const timeStr = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
      return `${index + 1}. ${dateStr} ${timeStr}`
    }).join('\n')

    await sendLineMessage(
      event.replyToken,
      [createTextMessage(`ご予約一覧:\n\n${appointmentList}\n\n予約の変更はWebサイトから行えます。`)],
      channelAccessToken
    )
  } catch (error) {
    console.error('予約確認エラー:', error)
    await sendLineMessage(
      event.replyToken,
      [createTextMessage('予約情報の取得に失敗しました。')],
      channelAccessToken
    )
  }
}

/**
 * お問い合わせリクエストを処理
 */
async function handleContactRequest(
  event: LineEvent,
  channelAccessToken: string
) {
  await sendLineMessage(
    event.replyToken,
    [createTextMessage('お問い合わせ内容をこちらに送信してください。\n\nスタッフが確認次第、返信いたします。')],
    channelAccessToken
  )
}

/**
 * GET: Webhook URLの確認用
 */
export async function GET() {
  return NextResponse.json({
    message: 'LINE Webhook endpoint is active',
    endpoint: '/api/line/webhook'
  })
}
