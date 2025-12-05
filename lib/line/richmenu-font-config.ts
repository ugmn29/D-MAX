import { registerFont } from 'canvas'
import path from 'path'
import fs from 'fs'

let fontRegistered = false

/**
 * リッチメニュー生成用のフォントを登録
 */
export function registerRichMenuFont() {
  if (fontRegistered) return

  try {
    // 本番環境（Vercel）とローカル開発環境で異なるフォントパスを試行
    const fontPaths = [
      // ダウンロードしたNoto Sans JP（最優先）
      path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP.ttf'),

      // macOS システムフォント
      '/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc',
      '/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc',
      '/System/Library/Fonts/Supplemental/Yu Gothic Bold.ttc',
      '/System/Library/Fonts/Supplemental/Yu Gothic.ttc',

      // Linux（Vercel）のシステムフォント
      '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',
      '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    ]

    let registered = false
    for (const fontPath of fontPaths) {
      if (fs.existsSync(fontPath)) {
        try {
          registerFont(fontPath, { family: 'RichMenuFont' })
          console.log(`✅ フォント登録成功: ${fontPath}`)
          registered = true
          fontRegistered = true
          break
        } catch (err) {
          console.warn(`⚠️ フォント登録失敗: ${fontPath}`, err)
        }
      }
    }

    if (!registered) {
      console.warn('⚠️ 日本語フォントが見つかりませんでした。デフォルトフォントを使用します。')
      // デフォルトフォントでも動作するように
      fontRegistered = true
    }
  } catch (error) {
    console.error('フォント登録エラー:', error)
    fontRegistered = true // エラーでも続行
  }
}

/**
 * リッチメニュー用のフォント名を取得
 */
export function getRichMenuFontFamily(): string {
  return '"RichMenuFont", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Meiryo UI", sans-serif'
}
