/**
 * LINE招待コード生成ユーティリティ
 */

/**
 * 8桁の招待コードを生成（例: AB12-CD34）
 * - 大文字英数字のみ使用（混同しやすい文字を除外: 0, O, I, 1, L）
 * - 4桁-4桁のフォーマット
 */
export function generateInvitationCode(): string {
  // 混同しやすい文字を除外した英数字
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) {
      code += '-'
    }
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}

/**
 * 招待コードの有効期限を計算（デフォルト: 30日後）
 */
export function calculateExpiration(days: number = 30): Date {
  const expiration = new Date()
  expiration.setDate(expiration.getDate() + days)
  expiration.setHours(23, 59, 59, 999) // その日の終わりまで
  return expiration
}

/**
 * 招待コードのフォーマットを検証
 */
export function validateInvitationCodeFormat(code: string): boolean {
  // AB12-CD34 形式かチェック
  const pattern = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/
  return pattern.test(code)
}

/**
 * 招待コードを正規化（小文字→大文字、スペース削除）
 */
export function normalizeInvitationCode(code: string): string {
  return code.toUpperCase().replace(/\s/g, '')
}
