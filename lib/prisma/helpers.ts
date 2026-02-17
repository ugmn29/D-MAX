/**
 * Prisma型変換ヘルパー関数
 */

/**
 * Date | null | undefined を Date に変換
 */
export function convertToDate(value: Date | null | undefined): Date {
  if (value instanceof Date) return value
  if (value === null || value === undefined) return new Date()
  return new Date(value)
}

/**
 * JSON値をパース
 */
export function convertToJSON<T = any>(value: any): T | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  return value as T
}

/**
 * enum値を文字列に変換
 */
export function convertEnumToString(value: any): string {
  if (value === null || value === undefined) return ''
  return String(value)
}
