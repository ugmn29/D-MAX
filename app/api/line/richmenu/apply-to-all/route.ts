import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@line/bot-sdk'

interface ApplyToAllRequest {
  channelAccessToken: string
  richMenuId: string
  menuType: 'registered' | 'unregistered'
}

/**
 * 全ユーザーにリッチメニューを適用するAPI
 * （既存の友だち全員にリッチメニューをリンク）
 */
export async function POST(request: NextRequest) {
  try {
    const body: ApplyToAllRequest = await request.json()
    const { channelAccessToken, richMenuId, menuType } = body

    console.log('=== Apply Rich Menu to All Users ===')
    console.log('Rich Menu ID:', richMenuId)
    console.log('Menu Type:', menuType)

    if (!channelAccessToken || !richMenuId) {
      return NextResponse.json(
        { error: 'Channel Access TokenとRich Menu IDが必要です' },
        { status: 400 }
      )
    }

    const client = new Client({ channelAccessToken })

    // 全フォロワーを取得するためのページネーション処理
    let continuationToken: string | undefined
    let totalApplied = 0
    let totalErrors = 0

    do {
      // フォロワーのリストを取得（最大300件）
      const followers = await client.getFollowers(continuationToken)

      console.log(`取得したユーザー数: ${followers.userIds.length}`)

      // 各ユーザーにリッチメニューをリンク
      for (const userId of followers.userIds) {
        try {
          await linkRichMenuToUser(userId, richMenuId, channelAccessToken)
          totalApplied++
          console.log(`✅ リッチメニュー適用: ${userId}`)
        } catch (error) {
          totalErrors++
          console.error(`❌ リッチメニュー適用失敗: ${userId}`, error)
        }
      }

      continuationToken = followers.next
    } while (continuationToken)

    console.log(`=== 完了 ===`)
    console.log(`適用成功: ${totalApplied}人`)
    console.log(`適用失敗: ${totalErrors}人`)

    return NextResponse.json({
      success: true,
      totalApplied,
      totalErrors,
      message: `${menuType === 'registered' ? '連携済み' : '未連携'}用リッチメニューを${totalApplied}人に適用しました`
    })
  } catch (error) {
    console.error('Error applying rich menu to all users:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'リッチメニューの適用に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * ユーザーにリッチメニューをリンク
 */
async function linkRichMenuToUser(
  userId: string,
  richMenuId: string,
  channelAccessToken: string
) {
  const response = await fetch(
    `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to link rich menu: ${error}`)
  }
}
