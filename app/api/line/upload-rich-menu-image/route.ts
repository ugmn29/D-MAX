import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'
import { createCanvas } from 'canvas'

/**
 * POST /api/line/upload-rich-menu-image
 * リッチメニューに画像をアップロード
 *
 * ボタンの配置に合わせた画像を自動生成してアップロード
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, rich_menu_id, buttons, menu_type } = body

    if (!rich_menu_id) {
      return NextResponse.json(
        { error: 'rich_menu_id is required' },
        { status: 400 }
      )
    }

    const lineSettings = await getLineSettings(clinic_id)

    // キャンバスを作成（リッチメニューの標準サイズ）
    const width = 2500
    const height = 1686
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // 背景色
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)

    // ボタン数に応じたレイアウト
    const cols = menu_type === 'registered' ? 2 : 3
    const rows = Math.ceil(buttons.length / cols)
    const cellWidth = width / cols
    const cellHeight = height / rows

    // 各ボタンを描画
    buttons.forEach((button: any, index: number) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = col * cellWidth
      const y = row * cellHeight

      // ボタンの枠線
      ctx.strokeStyle = '#E0E0E0'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, cellWidth, cellHeight)

      // アイコン領域（上部）
      const iconSize = 120
      const iconX = x + (cellWidth - iconSize) / 2
      const iconY = y + 100

      // アイコン（シンプルな丸）
      ctx.fillStyle = '#4A90E2'
      ctx.beginPath()
      ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2)
      ctx.fill()

      // アイコン内の記号（簡略化）
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 80px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // ボタンタイプに応じた記号
      let symbol = '●'
      if (button.label.includes('QR') || button.label.includes('診察券')) {
        symbol = '◉'
      } else if (button.label.includes('予約')) {
        symbol = '📅'
      } else if (button.label.includes('家族')) {
        symbol = '👥'
      } else if (button.label.includes('Web') || button.label.includes('サイト')) {
        symbol = '🌐'
      } else if (button.label.includes('問合') || button.label.includes('問い合わせ')) {
        symbol = '✉'
      } else if (button.label.includes('登録')) {
        symbol = '📝'
      }

      ctx.fillText(symbol, iconX + iconSize / 2, iconY + iconSize / 2)

      // ラベル（下部）
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 60px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      // ラベルを改行して表示
      const labelY = iconY + iconSize + 40
      const lines = button.label.split('\n')
      lines.forEach((line: string, lineIndex: number) => {
        ctx.fillText(line, x + cellWidth / 2, labelY + lineIndex * 70)
      })
    })

    // 画像をバッファに変換
    const imageBuffer = canvas.toBuffer('image/png')

    // LINE APIに画像をアップロード
    const uploadResponse = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${rich_menu_id}/content`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`,
          'Content-Type': 'image/png',
          'Content-Length': imageBuffer.length.toString()
        },
        body: imageBuffer as unknown as BodyInit
      }
    )

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      throw new Error(`Image upload failed: ${JSON.stringify(error)}`)
    }

    return NextResponse.json({
      success: true,
      message: 'リッチメニュー画像をアップロードしました',
      richMenuId: rich_menu_id
    })

  } catch (error) {
    console.error('リッチメニュー画像アップロードエラー:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload rich menu image',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
