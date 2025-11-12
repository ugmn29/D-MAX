/**
 * CSV取込ユーティリティ
 * CSV Import Utility for EMR Master Data
 */

import { readFileSync } from 'fs'
import { decode } from 'iconv-lite'

/**
 * Shift-JISエンコードされたCSVファイルをUTF-8に変換して読み込む
 * @param filePath ファイルパス
 * @returns UTF-8文字列
 */
export function readShiftJISFile(filePath: string): string {
  const buffer = readFileSync(filePath)
  return decode(buffer, 'shift-jis')
}

/**
 * CSVを行ごとに分割
 * @param csvContent CSV文字列
 * @returns 行の配列
 */
export function splitCSVLines(csvContent: string): string[] {
  return csvContent.split(/\r?\n/).filter((line) => line.trim() !== '')
}

/**
 * CSV行をフィールドに分割（引用符を考慮）
 * @param line CSV行
 * @returns フィールド配列
 */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // エスケープされた引用符
        currentField += '"'
        i++ // 次の引用符をスキップ
      } else {
        // 引用符の開始または終了
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // フィールド区切り
      fields.push(currentField)
      currentField = ''
    } else {
      currentField += char
    }
  }

  // 最後のフィールドを追加
  fields.push(currentField)

  return fields
}

/**
 * CSV全体をパース
 * @param csvContent CSV文字列
 * @returns レコード配列（各レコードはフィールド配列）
 */
export function parseCSV(csvContent: string): string[][] {
  const lines = splitCSVLines(csvContent)
  return lines.map(parseCSVLine)
}

/**
 * CSVファイルを読み込んでパース
 * @param filePath ファイルパス
 * @returns レコード配列
 */
export function readAndParseCSV(filePath: string): string[][] {
  const content = readShiftJISFile(filePath)
  return parseCSV(content)
}

/**
 * 日付文字列をDate型に変換（YYYYMMDD形式）
 * @param dateStr YYYYMMDD形式の文字列
 * @returns Date | null
 */
export function parseDateYYYYMMDD(dateStr: string): Date | null {
  if (!dateStr || dateStr === '99999999' || dateStr === '00000000') {
    return null
  }

  const year = parseInt(dateStr.substring(0, 4), 10)
  const month = parseInt(dateStr.substring(4, 6), 10)
  const day = parseInt(dateStr.substring(6, 8), 10)

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null
  }

  return new Date(year, month - 1, day)
}

/**
 * Date型をPostgreSQL DATE形式の文字列に変換
 * @param date Date
 * @returns YYYY-MM-DD形式の文字列
 */
export function formatDateForPostgres(date: Date | null): string | null {
  if (!date) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 数値文字列を数値に変換（小数点対応）
 * @param numStr 数値文字列
 * @returns number
 */
export function parseNumber(numStr: string): number {
  const num = parseFloat(numStr)
  return isNaN(num) ? 0 : num
}

/**
 * 配列をバッチに分割
 * @param array 配列
 * @param batchSize バッチサイズ
 * @returns バッチの配列
 */
export function chunk<T>(array: T[], batchSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    chunks.push(array.slice(i, i + batchSize))
  }
  return chunks
}

/**
 * 進捗表示用のヘルパー
 * @param current 現在の進捗
 * @param total 全体数
 * @param label ラベル
 */
export function logProgress(current: number, total: number, label: string) {
  const percentage = ((current / total) * 100).toFixed(1)
  console.log(`[${label}] ${current}/${total} (${percentage}%)`)
}
