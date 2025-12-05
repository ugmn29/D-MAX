import { createCanvas } from 'canvas'
import { registerRichMenuFont, getRichMenuFontFamily } from './richmenu-font-config'

export interface RichMenuButton {
  id: number
  label: string
  icon: string
  action: string
  url: string
}

// プレビューと一致する色設定（3列2段レイアウト順）
const buttonColors = [
  { from: '#FFF7ED', to: '#FFEDD5', border: '#FED7AA' }, // orange - Webサイト (左上)
  { from: '#EFF6FF', to: '#DBEAFE', border: '#BFDBFE' }, // blue - QRコード (中央上)
  { from: '#ECFDF5', to: '#D1FAE5', border: '#BBF7D0' }, // green - 予約確認 (右上)
  { from: '#F5F3FF', to: '#EDE9FE', border: '#DDD6FE' }, // purple - 家族登録 (左下)
  { from: '#FDF2F8', to: '#FCE7F3', border: '#FBCFE8' }, // pink - お問合せ (中央下)
  { from: '#FEF3C7', to: '#FDE68A', border: '#FCD34D' }  // yellow - 予約を取る (右下)
]

/**
 * リッチメニュー画像を生成
 * @param buttons ボタン設定
 * @param menuType リッチメニュータイプ（'registered': 6ボタン 2500x1686、'unregistered': 3ボタン 2500x843）
 */
export async function generateRichMenuImage(
  buttons: RichMenuButton[],
  menuType: 'registered' | 'unregistered' = 'registered'
): Promise<Buffer> {
  // フォントを登録
  registerRichMenuFont()

  const width = 2500
  const height = menuType === 'unregistered' ? 843 : 1686  // 未連携は1行分のみ
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 背景（グレーのグラデーション、落ち着いた色）
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#E5E7EB')  // 薄いグレー
  gradient.addColorStop(0.5, '#D1D5DB') // 少し濃いグレー
  gradient.addColorStop(1, '#E5E7EB')  // 薄いグレー
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const gap = 20  // マス目の間隔を広げて浮き出る感じに

  let customLayout: Array<{ button: RichMenuButton; type: string }>

  if (menuType === 'unregistered') {
    // 未連携ユーザー用レイアウト（3ボタン・横並び）
    customLayout = [
      { button: buttons[0], type: 'user' },       // 初回登録 (左)
      { button: buttons[1], type: 'web' },        // Webサイト (中央)
      { button: buttons[2], type: 'chat' },       // お問合せ (右)
    ]
  } else {
    // 連携済みユーザー用レイアウト（6ボタン）
    // 左列3段: [Webサイト] [家族登録] [お問合せ]
    // 中央・右列: [QRコード] [予約確認]
    //            [予約を取る(2マス分)]
    customLayout = [
      // 左列を3段に分割（縦幅均等）
      { button: buttons[3], type: 'web' },                 // Webサイト (左・1段目)
      { button: buttons[2], type: 'family' },              // 家族登録 (左・2段目)
      { button: buttons[4], type: 'chat' },                // お問合せ (左・3段目)
      // 中央・右列
      { button: buttons[0], type: 'qr' },                  // QRコード (中央上)
      { button: buttons[1], type: 'calendar' },            // 予約確認 (右上)
      { button: buttons[5], type: 'booking' },             // 予約を取る (中央下+右下の2マス分)
    ]
  }

  // グリッド設定
  const cols = 3
  const rows = menuType === 'unregistered' ? 1 : 2
  const buttonWidth = width / cols
  const buttonHeight = height / rows
  const leftColumnButtonHeight = menuType === 'registered' ? (height - gap * 4) / 3 : 0

  customLayout.forEach(({ button, type }, index) => {
    let buttonX, buttonY, buttonW, buttonH

    if (menuType === 'unregistered') {
      // 未連携ユーザー用（3ボタン横並び）
      if (type === 'user') {
        // 初回登録（左）
        buttonX = 0 * buttonWidth + gap
        buttonY = gap
        buttonW = buttonWidth - gap * 2
        buttonH = buttonHeight - gap * 2
      } else if (type === 'web') {
        // Webサイト（中央）
        buttonX = 1 * buttonWidth + gap
        buttonY = gap
        buttonW = buttonWidth - gap * 2
        buttonH = buttonHeight - gap * 2
      } else if (type === 'chat') {
        // お問合せ（右）
        buttonX = 2 * buttonWidth + gap
        buttonY = gap
        buttonW = buttonWidth - gap * 2
        buttonH = buttonHeight - gap * 2
      }
    } else {
      // 連携済みユーザー用（6ボタン）
      if (type === 'web') {
        // Webサイト（左列・1段目）
        buttonX = gap
        buttonY = gap
        buttonW = buttonWidth - gap * 2
        buttonH = leftColumnButtonHeight
      } else if (type === 'family') {
        // 家族登録（左列・2段目）
        buttonX = gap
        buttonY = gap + leftColumnButtonHeight + gap
        buttonW = buttonWidth - gap * 2
        buttonH = leftColumnButtonHeight
      } else if (type === 'chat') {
        // お問合せ（左列・3段目）
        buttonX = gap
        buttonY = gap + (leftColumnButtonHeight + gap) * 2
        buttonW = buttonWidth - gap * 2
        buttonH = leftColumnButtonHeight
      } else if (type === 'qr') {
        // QRコード（中央上）
        buttonX = 1 * buttonWidth + gap
        buttonY = 0 * buttonHeight + gap
        buttonW = buttonWidth - gap * 2
        buttonH = buttonHeight - gap * 2
      } else if (type === 'calendar') {
        // 予約確認（右上）
        buttonX = 2 * buttonWidth + gap
        buttonY = 0 * buttonHeight + gap
        buttonW = buttonWidth - gap * 2
        buttonH = buttonHeight - gap * 2
      } else if (type === 'booking') {
        // 予約を取る（中央下+右下の2マス分）
        buttonX = 1 * buttonWidth + gap
        buttonY = 1 * buttonHeight + gap
        buttonW = buttonWidth * 2 - gap * 2
        buttonH = buttonHeight - gap * 2
      }
    }

    // 色の設定
    let color
    if (type === 'user') color = buttonColors[1]                // blue - 初回登録
    else if (type === 'web') color = buttonColors[0]            // orange
    else if (type === 'family') color = buttonColors[3]         // purple
    else if (type === 'chat') color = buttonColors[4]           // pink
    else if (type === 'qr') color = buttonColors[1]             // blue
    else if (type === 'calendar') color = buttonColors[2]       // green
    else if (type === 'booking') color = buttonColors[5]        // yellow

    // 影を描画（浮き出る効果）
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
    ctx.shadowBlur = 25
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 8

    // 角丸の背景（カードのように）
    const radius = 30
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(buttonX, buttonY, buttonW, buttonH, radius)
    ctx.fill()

    // 影をリセット
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // グラデーション背景（左上から右下へ、角丸）
    const btnGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonW, buttonY + buttonH)
    btnGradient.addColorStop(0, color.from)
    btnGradient.addColorStop(1, color.to)
    ctx.fillStyle = btnGradient
    ctx.beginPath()
    ctx.roundRect(buttonX + 6, buttonY + 6, buttonW - 12, buttonH - 12, radius - 6)
    ctx.fill()

    // ボーダー（内側に細めの線、立体感）
    ctx.strokeStyle = color.border
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(buttonX + 6, buttonY + 6, buttonW - 12, buttonH - 12, radius - 6)
    ctx.stroke()

    // 中心座標
    const centerX = buttonX + buttonW / 2
    const centerY = buttonY + buttonH / 2

    // 未連携用の3ボタンは全てアイコンありに統一
    // 連携済みの場合、Webサイト、家族登録、お問合せはテキストのみ
    const isTextOnly = menuType === 'registered' && (type === 'web' || type === 'family' || type === 'chat')

    if (isTextOnly) {
      // テキストのみ中央配置
      ctx.font = `bold 85px ${getRichMenuFontFamily()}`
      ctx.fillStyle = '#1F2937'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(button.label, centerX, centerY)
    } else {
      // アイコンを上部に配置
      const iconSize = type === 'booking' ? 300 : 240  // 予約を取るは大きめ
      const iconY = buttonY + (type === 'booking' ? 330 : 280)
      ctx.fillStyle = '#1F2937'

      switch (button.icon) {
      case 'web':
        // 一般的な地球儀アイコン（グローブ）
        const globeRadius = iconSize/2 * 0.88

        // 外側の円
        ctx.beginPath()
        ctx.arc(centerX, iconY, globeRadius, 0, Math.PI * 2)
        ctx.strokeStyle = '#1F2937'
        ctx.lineWidth = 10
        ctx.stroke()

        // 中央の縦線（経線）
        ctx.beginPath()
        ctx.ellipse(centerX, iconY, globeRadius/3.5, globeRadius - 5, 0, 0, Math.PI * 2)
        ctx.lineWidth = 8
        ctx.stroke()

        // 横線（緯線）- 赤道
        ctx.beginPath()
        ctx.ellipse(centerX, iconY, globeRadius - 5, globeRadius/6, 0, 0, Math.PI * 2)
        ctx.stroke()

        // 上の緯線
        ctx.beginPath()
        ctx.ellipse(centerX, iconY - globeRadius/2.5, globeRadius * 0.7, globeRadius/8, 0, 0, Math.PI * 2)
        ctx.stroke()

        // 下の緯線
        ctx.beginPath()
        ctx.ellipse(centerX, iconY + globeRadius/2.5, globeRadius * 0.7, globeRadius/8, 0, 0, Math.PI * 2)
        ctx.stroke()
        break

      case 'qr':
        // 一般的なQRコードアイコン
        const qrSize = iconSize * 0.85
        const qrPadding = 20

        // 外枠（黒）
        ctx.fillStyle = '#1F2937'
        ctx.fillRect(centerX - qrSize/2, iconY - qrSize/2, qrSize, qrSize)

        // 内側（白）
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(
          centerX - qrSize/2 + qrPadding,
          iconY - qrSize/2 + qrPadding,
          qrSize - qrPadding * 2,
          qrSize - qrPadding * 2
        )

        // 3つのコーナーマーカー（典型的なQRコード）
        ctx.fillStyle = '#1F2937'
        const markerSize = 55
        const markerPositions = [
          {x: centerX - qrSize/2 + qrPadding + 10, y: iconY - qrSize/2 + qrPadding + 10},  // 左上
          {x: centerX + qrSize/2 - qrPadding - markerSize - 10, y: iconY - qrSize/2 + qrPadding + 10},  // 右上
          {x: centerX - qrSize/2 + qrPadding + 10, y: iconY + qrSize/2 - qrPadding - markerSize - 10},  // 左下
        ]

        markerPositions.forEach(pos => {
          // 外側の四角
          ctx.fillRect(pos.x, pos.y, markerSize, markerSize)
          // 内側の白
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(pos.x + 8, pos.y + 8, markerSize - 16, markerSize - 16)
          // 中心の黒
          ctx.fillStyle = '#1F2937'
          ctx.fillRect(pos.x + 18, pos.y + 18, markerSize - 36, markerSize - 36)
        })

        // 右下にランダムドット（QRコードっぽく）
        const dotSize = 12
        const dots = [
          [0, 0], [1, 0], [2, 0],
          [0, 1], [2, 1],
          [0, 2], [1, 2], [2, 2]
        ]

        dots.forEach(([dx, dy]) => {
          ctx.fillRect(
            centerX + qrSize/2 - qrPadding - 75 + dx * (dotSize + 5),
            iconY + qrSize/2 - qrPadding - 75 + dy * (dotSize + 5),
            dotSize,
            dotSize
          )
        })
        break

      case 'calendar':
        // カレンダー（モダンなデザイン）
        const calWidth = iconSize * 0.9
        const calHeight = iconSize * 0.85

        // カレンダー本体（角丸）
        ctx.fillStyle = '#1F2937'
        ctx.beginPath()
        ctx.roundRect(centerX - calWidth/2, iconY - calHeight/2, calWidth, calHeight, 15)
        ctx.fill()

        // ヘッダー部分（色付き）
        ctx.fillStyle = '#1F2937'
        ctx.fillRect(centerX - calWidth/2, iconY - calHeight/2, calWidth, 50)

        // バインダーの穴（リング）
        ctx.fillStyle = '#FFFFFF'
        const ringPositions = [-calWidth/3, 0, calWidth/3]
        ringPositions.forEach(x => {
          ctx.beginPath()
          ctx.arc(centerX + x, iconY - calHeight/2 + 25, 12, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(centerX + x, iconY - calHeight/2 + 25, 8, 0, Math.PI * 2)
          ctx.fillStyle = '#1F2937'
          ctx.fill()
          ctx.fillStyle = '#FFFFFF'
        })

        // 日付表示エリア（白背景）
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(centerX - calWidth/2 + 20, iconY - calHeight/2 + 65, calWidth - 40, calHeight - 90)

        // 日付の横線（シンプルに）
        ctx.fillStyle = '#E5E7EB'
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(
            centerX - calWidth/2 + 35,
            iconY - calHeight/2 + 90 + i * 35,
            calWidth - 70,
            3
          )
        }

        // チェックマーク（予約済みのイメージ）
        ctx.strokeStyle = '#10B981'
        ctx.lineWidth = 8
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(centerX - calWidth/2 + 45, iconY)
        ctx.lineTo(centerX - calWidth/2 + 65, iconY + 20)
        ctx.lineTo(centerX - calWidth/2 + 95, iconY - 30)
        ctx.stroke()
        break

      case 'user':
        // 初回登録（1人の人物アイコン + チェックマーク）
        const userSize = 120

        // 頭（円）
        ctx.fillStyle = '#1F2937'
        ctx.beginPath()
        ctx.arc(centerX, iconY - 50, userSize/2.5, 0, Math.PI * 2)
        ctx.fill()

        // 体（台形）
        ctx.beginPath()
        ctx.moveTo(centerX - userSize/2, iconY + 10)
        ctx.lineTo(centerX + userSize/2, iconY + 10)
        ctx.lineTo(centerX + userSize/1.3, iconY + 110)
        ctx.lineTo(centerX - userSize/1.3, iconY + 110)
        ctx.closePath()
        ctx.fill()

        // 右下にチェックマーク（登録完了のイメージ）
        ctx.beginPath()
        ctx.arc(centerX + userSize/1.5, iconY + 80, 45, 0, Math.PI * 2)
        ctx.fillStyle = '#10B981'
        ctx.fill()

        // チェックマーク（白）
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 10
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(centerX + userSize/1.5 - 20, iconY + 80)
        ctx.lineTo(centerX + userSize/1.5 - 8, iconY + 92)
        ctx.lineTo(centerX + userSize/1.5 + 20, iconY + 68)
        ctx.stroke()
        break

      case 'users':
        // 家族登録（モダンな人物アイコン）
        const personSize = 65
        const personSpacing = 85
        const personOffsets = [-personSpacing/2, personSpacing/2]

        // 2人の人物を描画
        personOffsets.forEach((offsetX, index) => {
          // 頭（円）
          ctx.fillStyle = '#1F2937'
          ctx.beginPath()
          ctx.arc(centerX + offsetX, iconY - 35, personSize/2.2, 0, Math.PI * 2)
          ctx.fill()

          // 体（台形）
          ctx.beginPath()
          ctx.moveTo(centerX + offsetX - personSize/2.5, iconY + 10)
          ctx.lineTo(centerX + offsetX + personSize/2.5, iconY + 10)
          ctx.lineTo(centerX + offsetX + personSize/1.8, iconY + 90)
          ctx.lineTo(centerX + offsetX - personSize/1.8, iconY + 90)
          ctx.closePath()
          ctx.fill()
        })

        // 家族の絆を表す円弧
        ctx.strokeStyle = '#1F2937'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(centerX, iconY - 60, 70, 0.3, Math.PI - 0.3)
        ctx.stroke()
        break

      case 'chat':
        // 吹き出し（モダンなデザイン）
        const bubbleWidth = iconSize * 0.95
        const bubbleHeight = iconSize * 0.7

        // メインの吹き出し（角丸）
        ctx.fillStyle = '#1F2937'
        ctx.beginPath()
        ctx.roundRect(centerX - bubbleWidth/2, iconY - bubbleHeight/2, bubbleWidth, bubbleHeight, 35)
        ctx.fill()

        // 吹き出しの尖り（三角形）
        ctx.beginPath()
        ctx.moveTo(centerX - bubbleWidth/3, iconY + bubbleHeight/2)
        ctx.lineTo(centerX - bubbleWidth/3 - 30, iconY + bubbleHeight/2 + 35)
        ctx.lineTo(centerX - bubbleWidth/3 + 15, iconY + bubbleHeight/2)
        ctx.closePath()
        ctx.fill()

        // 3つの点（アニメーション風）
        ctx.fillStyle = '#FFFFFF'
        const dotSizes = [22, 22, 22]
        const dotSpacing = 55
        dotSizes.forEach((size, i) => {
          ctx.beginPath()
          ctx.arc(centerX - dotSpacing + i * dotSpacing, iconY - 5, size, 0, Math.PI * 2)
          ctx.fill()
        })
        break

      case 'booking':
        // 予約を取る（ペンと予約用紙）
        const paperWidth = iconSize * 0.85
        const paperHeight = iconSize * 0.95

        // 用紙の影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.fillRect(centerX - paperWidth/2 + 8, iconY - paperHeight/2 + 8, paperWidth, paperHeight)

        // 用紙本体（角丸）
        ctx.fillStyle = '#1F2937'
        ctx.beginPath()
        ctx.roundRect(centerX - paperWidth/2, iconY - paperHeight/2, paperWidth, paperHeight, 12)
        ctx.fill()

        // 白い内側
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(centerX - paperWidth/2 + 18, iconY - paperHeight/2 + 18, paperWidth - 36, paperHeight - 36)

        // タイトル行（太め）
        ctx.fillStyle = '#1F2937'
        ctx.fillRect(centerX - paperWidth/2 + 35, iconY - paperHeight/2 + 40, paperWidth - 70, 10)

        // 予約情報の行（細め、整列）
        for (let i = 0; i < 5; i++) {
          const lineY = iconY - paperHeight/2 + 75 + i * 30
          // ラベル部分（短い）
          ctx.fillRect(centerX - paperWidth/2 + 35, lineY, 40, 6)
          // 記入欄（長い、薄い色）
          ctx.fillStyle = '#E5E7EB'
          ctx.fillRect(centerX - paperWidth/2 + 85, lineY, paperWidth - 120, 6)
          ctx.fillStyle = '#1F2937'
        }

        // ペン（斜めに配置、モダンなデザイン）
        ctx.save()
        ctx.translate(centerX + paperWidth/3, iconY + paperHeight/4)
        ctx.rotate(Math.PI / 5)

        // ペン本体（グラデーション風）
        ctx.fillStyle = '#1F2937'
        ctx.beginPath()
        ctx.roundRect(-12, -95, 24, 120, 4)
        ctx.fill()

        // ペン先（金色）
        ctx.fillStyle = '#FCD34D'
        ctx.beginPath()
        ctx.moveTo(-12, 25)
        ctx.lineTo(0, 45)
        ctx.lineTo(12, 25)
        ctx.closePath()
        ctx.fill()

        // ペンのクリップ
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(8, -75)
        ctx.lineTo(15, -85)
        ctx.lineTo(15, -65)
        ctx.stroke()

        ctx.restore()
        break

      default:
        // デフォルト（疑問符）
        ctx.font = 'bold 200px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#1F2937'
        ctx.fillText('?', centerX, iconY)
    }

      // ラベル（下部、太字で読みやすく）- アイコンありボタンのみ
      ctx.font = `bold 95px ${getRichMenuFontFamily()}`
      ctx.fillStyle = '#1F2937'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // 予約確認の場合は2段表記
      if (button.label === '予約確認') {
        ctx.fillText(button.label, centerX, buttonY + buttonH - 240)
        // 2段目の小さい文字
        ctx.font = `bold 65px ${getRichMenuFontFamily()}`
        ctx.fillStyle = '#6B7280'
        ctx.fillText('変更/キャンセル', centerX, buttonY + buttonH - 140)
      } else if (type === 'booking') {
        // 予約を取るは大きめに
        ctx.font = `bold 110px ${getRichMenuFontFamily()}`
        ctx.fillText(button.label, centerX, buttonY + buttonH - 200)
      } else {
        ctx.fillText(button.label, centerX, buttonY + buttonH - 200)
      }
    }
  })

  return canvas.toBuffer('image/png')
}
