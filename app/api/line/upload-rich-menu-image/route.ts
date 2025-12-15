import { NextRequest, NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'
import { createCanvas, CanvasRenderingContext2D } from 'canvas'

/**
 * POST /api/line/upload-rich-menu-image
 * リッチメニューに画像をアップロード
 *
 * プレビューと完全に同じデザインの画像を生成してアップロード
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, rich_menu_id, menu_type } = body

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

    // 背景（グレーのグラデーション風）
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, '#F3F4F6')
    bgGradient.addColorStop(1, '#F9FAFB')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    if (menu_type === 'registered') {
      // 連携済みユーザー用リッチメニュー - 6ボタンレイアウト
      drawRegisteredMenu(ctx, width, height)
    } else {
      // 未連携ユーザー用リッチメニュー - 3ボタンレイアウト
      drawUnregisteredMenu(ctx, width, height)
    }

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

/**
 * 連携済みユーザー用リッチメニューを描画（6ボタン）
 */
function drawRegisteredMenu(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gap = 20
  const leftColWidth = Math.floor(width / 3) - gap
  const rightColWidth = Math.floor((width * 2) / 3) - gap
  const rowHeight = Math.floor(height / 2) - gap
  const leftCellHeight = Math.floor(height / 3) - gap

  // 左列 - 3つのボタン
  // 1. Webサイト（オレンジ）
  drawButton(ctx, {
    x: gap,
    y: gap,
    width: leftColWidth,
    height: leftCellHeight,
    label: 'Webサイト',
    gradientFrom: '#FFF7ED',
    gradientTo: '#FFEDD5',
    borderColor: '#FDBA74',
    iconType: 'none'
  })

  // 2. 家族登録（パープル）
  drawButton(ctx, {
    x: gap,
    y: gap * 2 + leftCellHeight,
    width: leftColWidth,
    height: leftCellHeight,
    label: '家族登録',
    gradientFrom: '#FAF5FF',
    gradientTo: '#F3E8FF',
    borderColor: '#D8B4FE',
    iconType: 'none'
  })

  // 3. お問合せ（ピンク）
  drawButton(ctx, {
    x: gap,
    y: gap * 3 + leftCellHeight * 2,
    width: leftColWidth,
    height: leftCellHeight,
    label: 'お問合せ',
    gradientFrom: '#FDF2F8',
    gradientTo: '#FCE7F3',
    borderColor: '#F9A8D4',
    iconType: 'none'
  })

  // 右上 - 2つのボタン
  const rightStartX = leftColWidth + gap * 2
  const rightCellWidth = Math.floor(rightColWidth / 2) - gap / 2

  // 4. QRコード（ブルー）
  drawButton(ctx, {
    x: rightStartX,
    y: gap,
    width: rightCellWidth,
    height: rowHeight,
    label: 'QRコード',
    gradientFrom: '#EFF6FF',
    gradientTo: '#DBEAFE',
    borderColor: '#93C5FD',
    iconType: 'qr'
  })

  // 5. 予約確認（グリーン）
  drawButton(ctx, {
    x: rightStartX + rightCellWidth + gap,
    y: gap,
    width: rightCellWidth,
    height: rowHeight,
    label: '予約確認',
    subLabel: '変更/キャンセル',
    gradientFrom: '#F0FDF4',
    gradientTo: '#DCFCE7',
    borderColor: '#86EFAC',
    iconType: 'calendar'
  })

  // 6. 予約を取る（イエロー）- 右下全体
  drawButton(ctx, {
    x: rightStartX,
    y: rowHeight + gap * 2,
    width: rightColWidth,
    height: rowHeight,
    label: '予約を取る',
    gradientFrom: '#FEFCE8',
    gradientTo: '#FEF9C3',
    borderColor: '#FDE047',
    iconType: 'booking'
  })
}

/**
 * 未連携ユーザー用リッチメニューを描画（3ボタン）
 */
function drawUnregisteredMenu(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gap = 20
  const cellWidth = Math.floor(width / 3) - gap * 1.33
  const cellHeight = height - gap * 2

  // 1. 初回登録（ブルー）
  drawButton(ctx, {
    x: gap,
    y: gap,
    width: cellWidth,
    height: cellHeight,
    label: '初回登録',
    gradientFrom: '#EFF6FF',
    gradientTo: '#DBEAFE',
    borderColor: '#93C5FD',
    iconType: 'user'
  })

  // 2. Webサイト（オレンジ）
  drawButton(ctx, {
    x: cellWidth + gap * 2,
    y: gap,
    width: cellWidth,
    height: cellHeight,
    label: 'Webサイト',
    gradientFrom: '#FFF7ED',
    gradientTo: '#FFEDD5',
    borderColor: '#FDBA74',
    iconType: 'globe'
  })

  // 3. お問合せ（ピンク）
  drawButton(ctx, {
    x: (cellWidth + gap) * 2 + gap,
    y: gap,
    width: cellWidth,
    height: cellHeight,
    label: 'お問合せ',
    gradientFrom: '#FDF2F8',
    gradientTo: '#FCE7F3',
    borderColor: '#F9A8D4',
    iconType: 'mail'
  })
}

interface ButtonConfig {
  x: number
  y: number
  width: number
  height: number
  label: string
  subLabel?: string
  gradientFrom: string
  gradientTo: string
  borderColor: string
  iconType: 'none' | 'qr' | 'calendar' | 'booking' | 'user' | 'globe' | 'mail'
}

/**
 * ボタンを描画
 */
function drawButton(ctx: CanvasRenderingContext2D, config: ButtonConfig) {
  const { x, y, width, height, label, subLabel, gradientFrom, gradientTo, borderColor, iconType } = config
  const radius = 20

  // 影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  roundRect(ctx, x + 4, y + 4, width, height, radius)
  ctx.fill()

  // グラデーション背景
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, gradientFrom)
  gradient.addColorStop(1, gradientTo)
  ctx.fillStyle = gradient
  roundRect(ctx, x, y, width, height, radius)
  ctx.fill()

  // 枠線
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 3
  roundRect(ctx, x, y, width, height, radius)
  ctx.stroke()

  // アイコンとテキストの配置
  const centerX = x + width / 2
  const centerY = y + height / 2

  if (iconType !== 'none') {
    const iconSize = Math.min(width * 0.25, height * 0.35, 280)
    const iconY = centerY - height * 0.15

    drawIcon(ctx, iconType, centerX, iconY, iconSize)

    // ラベル（アイコンの下）
    ctx.fillStyle = '#1F2937'
    const fontSize = Math.min(width * 0.1, height * 0.12, 80)
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(label, centerX, iconY + iconSize / 2 + 30)

    // サブラベル
    if (subLabel) {
      ctx.fillStyle = '#6B7280'
      const subFontSize = fontSize * 0.65
      ctx.font = `600 ${subFontSize}px sans-serif`
      ctx.fillText(subLabel, centerX, iconY + iconSize / 2 + 30 + fontSize + 10)
    }
  } else {
    // アイコンなし（テキストのみ）
    ctx.fillStyle = '#1F2937'
    const fontSize = Math.min(width * 0.15, height * 0.2, 70)
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, centerX, centerY)
  }
}

/**
 * アイコンを描画
 */
function drawIcon(ctx: CanvasRenderingContext2D, type: string, cx: number, cy: number, size: number) {
  const s = size / 100 // スケール係数

  ctx.save()
  ctx.translate(cx - size / 2, cy - size / 2)

  switch (type) {
    case 'qr':
      // QRコードアイコン
      ctx.fillStyle = '#1F2937'
      ctx.fillRect(20 * s, 20 * s, 60 * s, 60 * s)
      ctx.fillStyle = 'white'
      ctx.fillRect(24 * s, 24 * s, 52 * s, 52 * s)

      // QRパターン
      ctx.fillStyle = '#1F2937'
      // 左上
      ctx.fillRect(28 * s, 28 * s, 16 * s, 16 * s)
      ctx.fillStyle = 'white'
      ctx.fillRect(30 * s, 30 * s, 12 * s, 12 * s)
      ctx.fillStyle = '#1F2937'
      ctx.fillRect(34 * s, 34 * s, 4 * s, 4 * s)
      // 右上
      ctx.fillRect(56 * s, 28 * s, 16 * s, 16 * s)
      ctx.fillStyle = 'white'
      ctx.fillRect(58 * s, 30 * s, 12 * s, 12 * s)
      ctx.fillStyle = '#1F2937'
      ctx.fillRect(62 * s, 34 * s, 4 * s, 4 * s)
      // 左下
      ctx.fillRect(28 * s, 56 * s, 16 * s, 16 * s)
      ctx.fillStyle = 'white'
      ctx.fillRect(30 * s, 58 * s, 12 * s, 12 * s)
      ctx.fillStyle = '#1F2937'
      ctx.fillRect(34 * s, 62 * s, 4 * s, 4 * s)
      // 右下パターン
      ctx.fillRect(56 * s, 56 * s, 3 * s, 3 * s)
      ctx.fillRect(61 * s, 56 * s, 3 * s, 3 * s)
      ctx.fillRect(66 * s, 56 * s, 3 * s, 3 * s)
      ctx.fillRect(56 * s, 61 * s, 3 * s, 3 * s)
      ctx.fillRect(66 * s, 61 * s, 3 * s, 3 * s)
      ctx.fillRect(56 * s, 66 * s, 3 * s, 3 * s)
      ctx.fillRect(61 * s, 66 * s, 3 * s, 3 * s)
      ctx.fillRect(66 * s, 66 * s, 3 * s, 3 * s)
      break

    case 'calendar':
      // カレンダーアイコン（予約確認）
      ctx.fillStyle = '#1F2937'
      roundRect(ctx, 17 * s, 23 * s, 66 * s, 62 * s, 4 * s)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.fillRect(23 * s, 42 * s, 54 * s, 38 * s)
      // カレンダーの丸
      ctx.fillStyle = 'white'
      ctx.strokeStyle = '#1F2937'
      ctx.lineWidth = 2 * s
      ctx.beginPath()
      ctx.arc(33 * s, 30 * s, 3.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(50 * s, 30 * s, 3.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(67 * s, 30 * s, 3.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      // 線
      ctx.fillStyle = '#E5E7EB'
      ctx.fillRect(27 * s, 48 * s, 46 * s, 2 * s)
      ctx.fillRect(27 * s, 58 * s, 46 * s, 2 * s)
      ctx.fillRect(27 * s, 68 * s, 46 * s, 2 * s)
      // チェックマーク
      ctx.strokeStyle = '#10B981'
      ctx.lineWidth = 3 * s
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(28 * s, 54 * s)
      ctx.lineTo(32 * s, 58 * s)
      ctx.lineTo(40 * s, 48 * s)
      ctx.stroke()
      break

    case 'booking':
      // 予約を取る（ノート＋ペン）
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(25 * s, 22 * s, 54 * s, 60 * s)
      ctx.fillStyle = '#1F2937'
      roundRect(ctx, 23 * s, 20 * s, 54 * s, 60 * s, 3 * s)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.fillRect(27 * s, 24 * s, 46 * s, 52 * s)
      // タイトル
      ctx.fillStyle = '#1F2937'
      ctx.fillRect(32 * s, 30 * s, 36 * s, 3 * s)
      // 行
      ctx.fillRect(32 * s, 38 * s, 12 * s, 2 * s)
      ctx.fillStyle = '#E5E7EB'
      ctx.fillRect(48 * s, 38 * s, 20 * s, 2 * s)
      ctx.fillStyle = '#1F2937'
      ctx.fillRect(32 * s, 44 * s, 12 * s, 2 * s)
      ctx.fillStyle = '#E5E7EB'
      ctx.fillRect(48 * s, 44 * s, 20 * s, 2 * s)
      ctx.fillStyle = '#1F2937'
      ctx.fillRect(32 * s, 50 * s, 12 * s, 2 * s)
      ctx.fillStyle = '#E5E7EB'
      ctx.fillRect(48 * s, 50 * s, 20 * s, 2 * s)
      ctx.fillStyle = '#1F2937'
      ctx.fillRect(32 * s, 56 * s, 12 * s, 2 * s)
      ctx.fillStyle = '#E5E7EB'
      ctx.fillRect(48 * s, 56 * s, 20 * s, 2 * s)
      ctx.fillStyle = '#1F2937'
      ctx.fillRect(32 * s, 62 * s, 12 * s, 2 * s)
      ctx.fillStyle = '#E5E7EB'
      ctx.fillRect(48 * s, 62 * s, 20 * s, 2 * s)
      // ペン
      ctx.save()
      ctx.translate(64 * s, 60 * s)
      ctx.rotate(36 * Math.PI / 180)
      ctx.fillStyle = '#1F2937'
      roundRect(ctx, -2 * s, -20 * s, 4 * s, 24 * s, 1 * s)
      ctx.fill()
      ctx.fillStyle = '#FCD34D'
      ctx.beginPath()
      ctx.moveTo(-2 * s, 4 * s)
      ctx.lineTo(0, 9 * s)
      ctx.lineTo(2 * s, 4 * s)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
      break

    case 'user':
      // ユーザーアイコン（初回登録）
      ctx.fillStyle = '#1F2937'
      ctx.beginPath()
      ctx.arc(50 * s, 35 * s, 15 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(25 * s, 75 * s)
      ctx.quadraticCurveTo(25 * s, 55 * s, 50 * s, 55 * s)
      ctx.quadraticCurveTo(75 * s, 55 * s, 75 * s, 75 * s)
      ctx.lineTo(25 * s, 75 * s)
      ctx.closePath()
      ctx.fill()
      // チェックマーク
      ctx.fillStyle = '#10B981'
      ctx.beginPath()
      ctx.arc(65 * s, 65 * s, 12 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2.5 * s
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(60 * s, 65 * s)
      ctx.lineTo(63 * s, 68 * s)
      ctx.lineTo(70 * s, 61 * s)
      ctx.stroke()
      break

    case 'globe':
      // 地球アイコン（Webサイト）
      ctx.strokeStyle = '#1F2937'
      ctx.lineWidth = 3 * s
      ctx.beginPath()
      ctx.arc(50 * s, 50 * s, 35 * s, 0, Math.PI * 2)
      ctx.stroke()
      // 縦の楕円
      ctx.beginPath()
      ctx.ellipse(50 * s, 50 * s, 15 * s, 35 * s, 0, 0, Math.PI * 2)
      ctx.stroke()
      // 横線
      ctx.beginPath()
      ctx.moveTo(15 * s, 50 * s)
      ctx.lineTo(85 * s, 50 * s)
      ctx.stroke()
      // 上下の曲線
      ctx.lineWidth = 2 * s
      ctx.beginPath()
      ctx.moveTo(20 * s, 30 * s)
      ctx.quadraticCurveTo(50 * s, 35 * s, 80 * s, 30 * s)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(20 * s, 70 * s)
      ctx.quadraticCurveTo(50 * s, 65 * s, 80 * s, 70 * s)
      ctx.stroke()
      break

    case 'mail':
      // メールアイコン（お問合せ）
      ctx.strokeStyle = '#1F2937'
      ctx.lineWidth = 3 * s
      roundRect(ctx, 20 * s, 30 * s, 60 * s, 45 * s, 5 * s)
      ctx.stroke()
      // 封筒の折り目
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(20 * s, 35 * s)
      ctx.lineTo(50 * s, 55 * s)
      ctx.lineTo(80 * s, 35 * s)
      ctx.stroke()
      break
  }

  ctx.restore()
}

/**
 * 角丸四角形を描画
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
