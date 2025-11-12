/**
 * 売上データCSVインポートAPI
 * 電子カルテシステムからの売上データインポート機能
 */

import { createClient } from '@supabase/supabase-js'

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
 * 患者IDで既存患者を検索
 */
export async function findPatientByExternalId(
  supabase: any,
  clinicId: string,
  externalPatientId: string
): Promise<string | null> {
  // 患者の外部IDまたはカルテ番号で検索
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('clinic_id', clinicId)
    .or(`patient_number.eq.${externalPatientId},external_id.eq.${externalPatientId}`)
    .single()

  if (error || !data) return null
  return data.id
}

/**
 * スタッフ名で既存スタッフを検索
 */
export async function findStaffByName(
  supabase: any,
  clinicId: string,
  staffName: string
): Promise<string | null> {
  if (!staffName) return null

  const { data, error } = await supabase
    .from('staff')
    .select('id')
    .eq('clinic_id', clinicId)
    .or(`name.eq.${staffName},display_name.eq.${staffName}`)
    .single()

  if (error || !data) return null
  return data.id
}

/**
 * 診療メニュー名で既存メニューを検索
 */
export async function findTreatmentMenuByName(
  supabase: any,
  clinicId: string,
  menuName: string
): Promise<string | null> {
  if (!menuName) return null

  const { data, error } = await supabase
    .from('treatment_menus')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('name', menuName)
    .single()

  if (error || !data) return null
  return data.id
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // CSVパース
  const rows = parseCSV(csvText)
  const errors: ImportError[] = []
  let successCount = 0

  // インポート履歴レコード作成
  const { data: importHistory, error: historyError } = await supabase
    .from('sales_import_history')
    .insert({
      clinic_id: clinicId,
      file_name: 'upload.csv',
      total_records: rows.length,
      success_records: 0,
      failed_records: 0,
      imported_by: options.importedBy,
      status: 'processing'
    })
    .select()
    .single()

  if (historyError || !importHistory) {
    return {
      success: false,
      import_id: '',
      total_records: rows.length,
      success_records: 0,
      failed_records: rows.length,
      errors: [{ row: 0, error: 'インポート履歴の作成に失敗しました', data: historyError }]
    }
  }

  // 各行を処理
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // ヘッダー行を考慮

    // バリデーション
    const validationError = validateRow(row, rowNum)
    if (validationError) {
      errors.push({ row: rowNum, error: validationError, data: row })
      if (!options.skipErrors) break
      continue
    }

    try {
      // 患者検索
      const patientId = await findPatientByExternalId(supabase, clinicId, row.patient_id!)
      if (!patientId) {
        errors.push({
          row: rowNum,
          error: `患者ID「${row.patient_id}」が見つかりません`,
          data: row
        })
        if (!options.skipErrors) break
        continue
      }

      // スタッフ検索
      const staffId = row.staff_name
        ? await findStaffByName(supabase, clinicId, row.staff_name)
        : null

      // 診療メニュー検索
      const treatmentMenuId = row.treatment_menu
        ? await findTreatmentMenuByName(supabase, clinicId, row.treatment_menu)
        : null

      // 診療行為コードの配列化
      const treatmentCodes = row.treatment_codes
        ? row.treatment_codes.split(',').map(c => c.trim())
        : null

      // 売上データ作成
      const salesData = {
        clinic_id: clinicId,
        patient_id: patientId,
        staff_id: staffId,
        treatment_menu_id: treatmentMenuId,
        receipt_number: row.receipt_number,
        treatment_date: normalizeDate(row.treatment_date!),
        sale_date: row.sale_date ? normalizeDate(row.sale_date) : normalizeDate(row.treatment_date!),
        insurance_type: row.insurance_type || '',
        insurance_points: normalizeNumber(row.insurance_points || 0),
        insurance_amount: normalizeNumber(row.insurance_amount || 0),
        patient_copay: normalizeNumber(row.patient_copay || 0),
        self_pay_amount: normalizeNumber(row.self_pay_amount || 0),
        total_amount: normalizeNumber(row.total_amount!),
        amount: normalizeNumber(row.total_amount!), // 既存のamountフィールド
        category: normalizeInsuranceType(row.insurance_type || ''),
        payment_method: row.payment_method || '',
        treatment_codes: treatmentCodes,
        notes: row.notes || '',
        imported_at: new Date().toISOString(),
        import_file_name: 'upload.csv'
      }

      // ドライラン時はスキップ
      if (!options.dryRun) {
        const { error: insertError } = await supabase
          .from('sales')
          .insert(salesData)

        if (insertError) {
          errors.push({
            row: rowNum,
            error: `登録エラー: ${insertError.message}`,
            data: row
          })
          if (!options.skipErrors) break
          continue
        }
      }

      successCount++
    } catch (error: any) {
      errors.push({
        row: rowNum,
        error: `予期しないエラー: ${error.message}`,
        data: row
      })
      if (!options.skipErrors) break
    }
  }

  // インポート履歴を更新
  const finalStatus = errors.length === 0 ? 'completed' :
                     successCount > 0 ? 'completed' : 'failed'

  await supabase
    .from('sales_import_history')
    .update({
      success_records: successCount,
      failed_records: errors.length,
      status: finalStatus,
      error_details: errors.length > 0 ? errors : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', importHistory.id)

  return {
    success: errors.length === 0 || (options.skipErrors && successCount > 0),
    import_id: importHistory.id,
    total_records: rows.length,
    success_records: successCount,
    failed_records: errors.length,
    errors
  }
}
