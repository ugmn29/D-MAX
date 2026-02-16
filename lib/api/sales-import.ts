// Migrated to Prisma API Routes
/**
 * 売上データCSVインポートAPI
 * 電子カルテシステムからの売上データインポート機能
 */

// CSVパース用の型定義
export interface SalesCSVRow {
  receipt_number?: string
  treatment_date?: string
  sale_date?: string
  patient_id?: string
  patient_name?: string
  insurance_type?: string
  insurance_points?: string | number
  insurance_amount?: string | number
  patient_copay?: string | number
  self_pay_amount?: string | number
  total_amount?: string | number
  payment_method?: string
  staff_name?: string
  treatment_menu?: string
  treatment_codes?: string
  notes?: string
  appointment_id?: string
}

export interface ImportResult {
  success: boolean
  import_id: string
  total_records: number
  success_records: number
  failed_records: number
  errors: ImportError[]
}

export interface ImportError {
  row: number
  error: string
  data: any
}

/**
 * CSV文字列をパースしてオブジェクト配列に変換
 */
export function parseCSV(csvText: string): SalesCSVRow[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // ヘッダー行の解析
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  // データ行の解析
  const rows: SalesCSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

/**
 * 日付文字列を正規化（YYYY-MM-DD形式に変換）
 */
export function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null

  // YYYY/MM/DD → YYYY-MM-DD
  if (dateStr.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
    const parts = dateStr.split('/')
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  }

  // YYYYMMDD → YYYY-MM-DD
  if (dateStr.match(/^\d{8}$/)) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  }

  // 既にYYYY-MM-DD形式
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr
  }

  return null
}

/**
 * 数値文字列を整数に変換（カンマ除去）
 */
export function normalizeNumber(numStr: string | number): number {
  if (typeof numStr === 'number') return numStr
  if (!numStr) return 0

  // カンマを除去して数値に変換
  const cleaned = String(numStr).replace(/,/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

/**
 * 保険種別を正規化
 */
export function normalizeInsuranceType(type: string): 'insurance' | 'self_pay' {
  if (!type) return 'insurance'

  // 一般的な歯科レセコンのコード形式対応
  // 9, 99: 自費診療コード（多くのレセコンで共通）
  if (type === '9' || type === '99') {
    return 'self_pay'
  }

  // 0, "自費": 自費診療の別表記
  if (type === '0' || type === '自費') {
    return 'self_pay'
  }

  const selfPayKeywords = ['自費', '自由', 'self', 'private']
  if (selfPayKeywords.some(keyword => type.includes(keyword))) {
    return 'self_pay'
  }

  return 'insurance'
}

/**
 * 保険種別コードを日本語に変換（一般的な歯科レセコンのコード体系に対応）
 */
export function decodeInsuranceType(code: string): string {
  const codeMap: { [key: string]: string } = {
    '1': '社保',
    '2': '国保',
    '3': '後期高齢',
    '4': '労災',
    '5': '公費',
    '9': '自費',
    '99': '自費'
  }
  return codeMap[code] || code
}

/**
 * 支払方法コードを日本語に変換
 */
export function decodePaymentMethod(code: string): string {
  const codeMap: { [key: string]: string } = {
    '1': '現金',
    '2': 'クレジットカード',
    '3': 'QR決済',
    '4': '未収',
    '5': '振込'
  }
  return codeMap[code] || code
}

/**
 * CSVデータ1行をバリデーション
 */
export function validateRow(row: SalesCSVRow, rowIndex: number): string | null {
  // 必須項目チェック
  if (!row.receipt_number) {
    return `行${rowIndex}: レセプト番号が必要です`
  }

  if (!row.treatment_date) {
    return `行${rowIndex}: 診療日が必要です`
  }

  if (!row.patient_id) {
    return `行${rowIndex}: 患者IDが必要です`
  }

  if (!row.total_amount) {
    return `行${rowIndex}: 合計金額が必要です`
  }

  // 日付の妥当性チェック
  const normalizedDate = normalizeDate(row.treatment_date)
  if (!normalizedDate) {
    return `行${rowIndex}: 診療日の形式が不正です（${row.treatment_date}）`
  }

  // 金額の妥当性チェック
  const amount = normalizeNumber(row.total_amount)
  if (amount < 0) {
    return `行${rowIndex}: 合計金額は0以上である必要があります`
  }

  return null
}

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * 売上データをインポート
 */
export async function importSalesData(
  csvText: string,
  clinicId: string,
  options: {
    skipErrors?: boolean
    dryRun?: boolean
    importedBy?: string
  } = {}
): Promise<ImportResult> {
  try {
    const response = await fetch(`${baseUrl}/api/sales-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        csvText,
        clinicId,
        options
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '売上データのインポートに失敗しました')
    }

    return await response.json()
  } catch (error: any) {
    console.error('売上インポートエラー:', error)

    // ネットワークエラー等の場合はエラーResultを返す
    return {
      success: false,
      import_id: '',
      total_records: 0,
      success_records: 0,
      failed_records: 0,
      errors: [{ row: 0, error: error.message || '売上データのインポートに失敗しました', data: null }]
    }
  }
}
