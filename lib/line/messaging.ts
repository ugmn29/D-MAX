/**
 * LINE Messaging API ヘルパー関数
 */

// Migrated to Prisma API Routes

// LINE Messaging APIのベースURL
const LINE_MESSAGING_API_BASE = 'https://api.line.me/v2/bot'

/**
 * LINE設定を取得
 */
export async function getLineSettings(clinicId: string) {
  const baseUrl = typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    : ''

  // LINE基本設定を取得
  const lineResponse = await fetch(
    `${baseUrl}/api/clinic/settings?clinic_id=${clinicId}&setting_key=line`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }
  )

  if (!lineResponse.ok) {
    throw new Error('LINE設定取得エラー')
  }

  const lineData = await lineResponse.json()
  const lineSettings = lineData.settings?.[0]

  if (!lineSettings || !lineSettings.setting_value) {
    throw new Error('LINE設定が見つかりません')
  }

  const line = lineSettings.setting_value

  if (!line.channel_access_token) {
    throw new Error('LINE Channel Access Tokenが設定されていません')
  }

  // リッチメニュー設定を取得
  const richMenuResponse = await fetch(
    `${baseUrl}/api/clinic/settings?clinic_id=${clinicId}&setting_key=line_rich_menu`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }
  )

  let richMenu: any = {}
  if (richMenuResponse.ok) {
    const richMenuData = await richMenuResponse.json()
    richMenu = richMenuData.settings?.[0]?.setting_value || {}
  }

  return {
    channelAccessToken: line.channel_access_token,
    channelSecret: line.channel_secret,
    registeredRichMenuId: richMenu.line_registered_rich_menu_id,
    unregisteredRichMenuId: richMenu.line_unregistered_rich_menu_id
  }
}

/**
 * LINEメッセージを送信
 */
export async function sendLineMessage(params: {
  channelAccessToken: string
  to: string
  messages: any[]
}) {
  const { channelAccessToken, to, messages } = params

  const response = await fetch(`${LINE_MESSAGING_API_BASE}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      to,
      messages
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`LINE送信エラー: ${error.message || response.statusText}`)
  }

  return response.json()
}

/**
 * テキストメッセージを送信
 */
export async function sendTextMessage(params: {
  channelAccessToken: string
  to: string
  text: string
}) {
  return sendLineMessage({
    channelAccessToken: params.channelAccessToken,
    to: params.to,
    messages: [
      {
        type: 'text',
        text: params.text
      }
    ]
  })
}

/**
 * Flex Messageを送信
 */
export async function sendFlexMessage(params: {
  channelAccessToken: string
  to: string
  altText: string
  contents: any
}) {
  return sendLineMessage({
    channelAccessToken: params.channelAccessToken,
    to: params.to,
    messages: [
      {
        type: 'flex',
        altText: params.altText,
        contents: params.contents
      }
    ]
  })
}

/**
 * リッチメニューをユーザーに紐付け
 */
export async function linkRichMenu(params: {
  channelAccessToken: string
  userId: string
  richMenuId: string
}) {
  const { channelAccessToken, userId, richMenuId } = params

  const response = await fetch(
    `${LINE_MESSAGING_API_BASE}/user/${userId}/richmenu/${richMenuId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`リッチメニュー紐付けエラー: ${error}`)
  }

  return true
}

/**
 * リッチメニューの紐付けを解除
 */
export async function unlinkRichMenu(params: {
  channelAccessToken: string
  userId: string
}) {
  const { channelAccessToken, userId } = params

  const response = await fetch(
    `${LINE_MESSAGING_API_BASE}/user/${userId}/richmenu`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`
      }
    }
  )

  if (!response.ok && response.status !== 404) {
    const error = await response.text()
    throw new Error(`リッチメニュー解除エラー: ${error}`)
  }

  return true
}

/**
 * 予約リマインドのFlex Messageを生成
 */
export function createAppointmentReminderFlex(params: {
  patientName: string
  appointmentDate: string
  appointmentTime: string
  clinicName: string
  treatmentMenuName?: string
  webBookingUrl?: string
}) {
  const { patientName, appointmentDate, appointmentTime, clinicName, treatmentMenuName, webBookingUrl } = params

  const contents: any = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '予約リマインド',
          weight: 'bold',
          color: '#ffffff',
          size: 'lg'
        }
      ],
      backgroundColor: '#00B900',
      paddingAll: 'md'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${patientName}様`,
          weight: 'bold',
          size: 'xl',
          margin: 'none'
        },
        {
          type: 'text',
          text: 'ご予約のお知らせです',
          size: 'sm',
          color: '#999999',
          margin: 'md'
        },
        {
          type: 'separator',
          margin: 'xl'
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'xl',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '日時',
                  size: 'sm',
                  color: '#555555',
                  flex: 0
                },
                {
                  type: 'text',
                  text: `${appointmentDate} ${appointmentTime}`,
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  weight: 'bold'
                }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [] as any[],
      flex: 0
    }
  }

  // 診療メニューがある場合
  if (treatmentMenuName) {
    contents.body.contents.push({
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'text',
          text: '診療内容',
          size: 'sm',
          color: '#555555',
          flex: 0
        },
        {
          type: 'text',
          text: treatmentMenuName,
          size: 'sm',
          color: '#111111',
          align: 'end'
        }
      ]
    })
  }

  // Web予約URLがある場合、変更・キャンセルボタンを追加
  if (webBookingUrl) {
    contents.footer.contents.push({
      type: 'button',
      style: 'link',
      height: 'sm',
      action: {
        type: 'uri',
        label: '予約を変更・キャンセル',
        uri: webBookingUrl
      }
    })
  }

  // クリニック情報
  contents.footer.contents.push({
    type: 'text',
    text: clinicName,
    color: '#aaaaaa',
    size: 'xs',
    align: 'center',
    margin: 'md'
  })

  return contents
}

/**
 * 定期検診のFlex Messageを生成
 */
export function createPeriodicCheckupFlex(params: {
  patientName: string
  clinicName: string
  lastVisitDate?: string
  webBookingUrl?: string
  treatmentMenuNames?: string[]
}) {
  const { patientName, clinicName, lastVisitDate, webBookingUrl, treatmentMenuNames } = params

  const contents: any = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '定期検診のお知らせ',
          weight: 'bold',
          color: '#ffffff',
          size: 'lg'
        }
      ],
      backgroundColor: '#0084FF',
      paddingAll: 'md'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: `${patientName}様`,
          weight: 'bold',
          size: 'xl',
          margin: 'none'
        },
        {
          type: 'text',
          text: '定期検診の時期が近づいています',
          size: 'sm',
          color: '#999999',
          margin: 'md',
          wrap: true
        },
        {
          type: 'separator',
          margin: 'xl'
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [] as any[],
      flex: 0
    }
  }

  // 最終来院日がある場合
  if (lastVisitDate) {
    contents.body.contents.push({
      type: 'box',
      layout: 'vertical',
      margin: 'xl',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: '前回の来院',
              size: 'sm',
              color: '#555555',
              flex: 0
            },
            {
              type: 'text',
              text: lastVisitDate,
              size: 'sm',
              color: '#111111',
              align: 'end'
            }
          ]
        }
      ]
    })
  }

  // 推奨診療メニューがある場合
  if (treatmentMenuNames && treatmentMenuNames.length > 0) {
    contents.body.contents.push({
      type: 'box',
      layout: 'vertical',
      margin: 'xl',
      spacing: 'sm',
      contents: [
        {
          type: 'text',
          text: '推奨メニュー',
          size: 'sm',
          color: '#555555',
          margin: 'none'
        },
        ...treatmentMenuNames.map(name => ({
          type: 'text',
          text: `• ${name}`,
          size: 'sm',
          color: '#111111',
          margin: 'sm'
        }))
      ]
    })
  }

  // Web予約ボタン
  if (webBookingUrl) {
    contents.footer.contents.push({
      type: 'button',
      style: 'primary',
      height: 'sm',
      action: {
        type: 'uri',
        label: 'Web予約はこちら',
        uri: webBookingUrl
      },
      color: '#0084FF'
    })
  }

  // クリニック情報
  contents.footer.contents.push({
    type: 'text',
    text: clinicName,
    color: '#aaaaaa',
    size: 'xs',
    align: 'center',
    margin: 'md'
  })

  return contents
}
