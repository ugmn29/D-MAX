/**
 * CSVエクスポートユーティリティ
 */

export interface CSVColumn {
  key: string
  label: string
  format?: (value: any) => string
}

/**
 * データをCSV形式に変換
 */
export function convertToCSV(data: any[], columns: CSVColumn[]): string {
  // ヘッダー行
  const headers = columns.map(col => `"${col.label}"`).join(',')

  // データ行
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key]

      // フォーマット関数がある場合は適用
      if (col.format) {
        value = col.format(value)
      }

      // null/undefinedの場合は空文字
      if (value === null || value === undefined) {
        return '""'
      }

      // 数値の場合はそのまま
      if (typeof value === 'number') {
        return value
      }

      // 文字列の場合はダブルクォートで囲む（カンマ・改行対策）
      const stringValue = String(value)
        .replace(/"/g, '""') // ダブルクォートをエスケープ
        .replace(/\n/g, ' ') // 改行をスペースに

      return `"${stringValue}"`
    }).join(',')
  }).join('\n')

  return `${headers}\n${rows}`
}

/**
 * CSVファイルをダウンロード
 */
export function downloadCSV(csv: string, filename: string) {
  // BOM付きUTF-8（Excel対応）
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })

  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * データをCSVとしてエクスポート（ワンショット関数）
 */
export function exportToCSV(data: any[], columns: CSVColumn[], filename: string) {
  const csv = convertToCSV(data, columns)
  downloadCSV(csv, filename)
}
