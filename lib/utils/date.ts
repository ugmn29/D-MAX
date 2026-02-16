/**
 * 日本の歯科医院向け日付処理ユーティリティ
 * 全て日本時間（JST）として扱い、UTCとの混在を避ける
 */

/**
 * 現在の日本時間のDateオブジェクトを取得
 */
export function getJapanDate(): Date {
  const now = new Date()
  // 日本時間のオフセット（UTC+9）を適用
  const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
  return japanTime
}

/**
 * 日本時間の今日の日付を YYYY-MM-DD 形式で取得
 */
export function getTodayJapan(): string {
  const date = getJapanDate()
  return date.toISOString().split('T')[0]
}

/**
 * Dateオブジェクトを YYYY-MM-DD 形式に変換（日本時間として扱う）
 */
export function formatDateForDB(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * YYYY-MM-DD 形式の文字列をDateオブジェクトに変換（日本時間として扱う）
 */
export function parseDBDate(dateString: string): Date {
  // ISO形式 "YYYY-MM-DDT00:00:00.000Z" にも対応
  const datePart = dateString.split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * 日付を日本語形式で表示
 */
export function formatJapaneseDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseDBDate(date) : date
  return dateObj.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

/**
 * 年齢計算（日本時間ベース）
 */
export function calculateAge(birthDateString: string): number {
  const birthDate = parseDBDate(birthDateString)
  const today = new Date() // ローカル時間を使用

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * 日付の加減算
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseDBDate(date) : new Date(date)
  const result = new Date(dateObj)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * 日付比較（YYYY-MM-DD 形式の文字列で比較）
 */
export function compareDates(date1: string, date2: string): number {
  return date1.localeCompare(date2)
}

/**
 * 今日かどうかを判定
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayJapan()
}

/**
 * 今週の範囲を取得
 */
export function getWeekRange(date: Date): { start: string; end: string } {
  const startOfWeek = new Date(date)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day // 日曜日を週の始まりとする

  startOfWeek.setDate(diff)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  return {
    start: formatDateForDB(startOfWeek),
    end: formatDateForDB(endOfWeek)
  }
}

/**
 * 月の範囲を取得
 */
export function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear()
  const month = date.getMonth()

  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0)

  return {
    start: formatDateForDB(startOfMonth),
    end: formatDateForDB(endOfMonth)
  }
}