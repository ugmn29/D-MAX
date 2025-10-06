import { createCanvas, registerFont } from 'canvas'

export interface RichMenuButton {
  id: number
  label: string
  icon: string
  action: string
  url: string
}

const iconEmojis: Record<string, string> = {
  qr: '📱',
  calendar: '📅',
  users: '👥',
  web: '🌐',
  chat: '💬'
}

const buttonColors = [
  { from: '#EFF6FF', to: '#DBEAFE', border: '#BFDBFE' }, // blue
  { from: '#F0FDF4', to: '#DCFCE7', border: '#BBF7D0' }, // green
  { from: '#FDF4FF', to: '#FAE8FF', border: '#F5D0FE' }, // purple
  { from: '#FFF7ED', to: '#FFEDD5', border: '#FED7AA' }, // orange
  { from: '#FDF2F8', to: '#FCE7F3', border: '#FBCFE8' }  // pink
]

/**
 * リッチメニュー画像を生成（2500x1686px、3列2段レイアウト）
 */
export async function generateRichMenuImage(buttons: RichMenuButton[]): Promise<Buffer> {
  const width = 2500
  const height = 1686
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 背景
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#F9FAFB')
  gradient.addColorStop(1, '#FFFFFF')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // グリッド設定（3列2段）
  const cols = 3
  const rows = 2
  const buttonWidth = width / cols
  const buttonHeight = height / rows
  const gap = 2

  // ボタン配置: [QR, 予約, Web] [家族, お問合せ×2]
  const layout = [
    { button: buttons[0], x: 0, y: 0, colspan: 1 }, // QRコード
    { button: buttons[1], x: 1, y: 0, colspan: 1 }, // 予約確認
    { button: buttons[3], x: 2, y: 0, colspan: 1 }, // Webサイト
    { button: buttons[2], x: 0, y: 1, colspan: 1 }, // 家族登録
    { button: buttons[4], x: 1, y: 1, colspan: 2 }  // お問合せ（2枠分）
  ]

  layout.forEach(({ button, x, y, colspan }, index) => {
    const buttonX = x * buttonWidth + gap
    const buttonY = y * buttonHeight + gap
    const buttonW = buttonWidth * colspan - gap * 2
    const buttonH = buttonHeight - gap * 2

    const color = buttonColors[index % buttonColors.length]

    // グラデーション背景
    const btnGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonW, buttonY + buttonH)
    btnGradient.addColorStop(0, color.from)
    btnGradient.addColorStop(1, color.to)
    ctx.fillStyle = btnGradient
    ctx.fillRect(buttonX, buttonY, buttonW, buttonH)

    // ボーダー
    ctx.strokeStyle = color.border
    ctx.lineWidth = 4
    ctx.strokeRect(buttonX, buttonY, buttonW, buttonH)

    // アイコン（シンプルな図形で描画）
    const centerX = buttonX + buttonW / 2
    const centerY = buttonY + buttonH / 2 - 80
    const iconSize = 150

    ctx.fillStyle = '#1F2937'
    ctx.strokeStyle = '#1F2937'
    ctx.lineWidth = 12

    switch (button.icon) {
      case 'qr':
        // QRコード風の四角形
        ctx.fillRect(centerX - iconSize/2, centerY - iconSize/2, iconSize, iconSize)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(centerX - iconSize/3, centerY - iconSize/3, iconSize/1.5, iconSize/1.5)
        break
      case 'calendar':
        // カレンダー
        ctx.strokeRect(centerX - iconSize/2, centerY - iconSize/2 + 20, iconSize, iconSize - 20)
        ctx.fillRect(centerX - iconSize/2, centerY - iconSize/2 + 20, iconSize, 30)
        break
      case 'users':
        // 人物アイコン（円と半円）
        ctx.beginPath()
        ctx.arc(centerX - 40, centerY - 40, 50, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(centerX + 40, centerY - 40, 50, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(centerX - 40, centerY + 60, 70, Math.PI, 0, true)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(centerX + 40, centerY + 60, 70, Math.PI, 0, true)
        ctx.fill()
        break
      case 'web':
        // 地球儀
        ctx.beginPath()
        ctx.arc(centerX, centerY, iconSize/2, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, iconSize/2, iconSize/4, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(centerX, centerY - iconSize/2)
        ctx.lineTo(centerX, centerY + iconSize/2)
        ctx.stroke()
        break
      case 'chat':
        // 吹き出し
        ctx.beginPath()
        ctx.roundRect(centerX - iconSize/2, centerY - iconSize/2, iconSize, iconSize * 0.7, 20)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(centerX - 20, centerY + iconSize/2 - 35)
        ctx.lineTo(centerX - 60, centerY + iconSize/2 + 20)
        ctx.lineTo(centerX + 10, centerY + iconSize/2 - 35)
        ctx.fill()
        break
      default:
        ctx.fillRect(centerX - iconSize/2, centerY - iconSize/2, iconSize, iconSize)
    }

    // ラベル
    ctx.font = 'bold 80px Arial, sans-serif'
    ctx.fillStyle = '#1F2937'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(button.label, centerX, buttonY + buttonH / 2 + 120)
  })

  return canvas.toBuffer('image/png')
}
