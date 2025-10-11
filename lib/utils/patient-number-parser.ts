import { getSupabaseClient } from '@/lib/utils/supabase-client'

/**
 * 患者番号解析オプション
 */
export interface PatientNumberParseOptions {
  preserveLeadingZeros?: boolean // 先頭ゼロを保持するか
}

/**
 * 患者番号を解析して数値化
 *
 * @param input - 入力文字列（例: "P-1001", "000123", "1001"）
 * @param options - 解析オプション
 * @returns 数値化された患者番号、または null（数字が含まれない場合）
 *
 * @example
 * parsePatientNumber("P-1001") // 1001
 * parsePatientNumber("000123") // 123
 * parsePatientNumber("ABC-DEF") // null
 */
export function parsePatientNumber(
  input: string,
  options: PatientNumberParseOptions = {}
): number | null {
  if (!input || typeof input !== 'string') return null

  // 数字のみを抽出
  const numbers = input.replace(/[^\d]/g, '')

  if (!numbers) return null

  // 数値化
  const parsed = parseInt(numbers, 10)

  // NaNチェック
  return isNaN(parsed) ? null : parsed
}

/**
 * 患者番号が既に存在するかチェック
 *
 * @param clinicId - クリニックID
 * @param patientNumber - チェックする患者番号
 * @returns 存在する場合 true
 */
export async function checkPatientNumberExists(
  clinicId: string,
  patientNumber: number
): Promise<boolean> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('patients')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('patient_number', patientNumber)
    .limit(1)

  if (error) {
    console.error('患者番号チェックエラー:', error)
    return false
  }

  return (data?.length ?? 0) > 0
}

/**
 * 利用可能な次の患者番号を取得
 *
 * @param clinicId - クリニックID
 * @param startFrom - 開始番号（デフォルト: 10000）
 * @returns 利用可能な次の患者番号
 */
export async function getNextAvailablePatientNumber(
  clinicId: string,
  startFrom: number = 10000
): Promise<number> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('patients')
    .select('patient_number')
    .eq('clinic_id', clinicId)
    .gte('patient_number', startFrom)
    .order('patient_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('次の患者番号取得エラー:', error)
    return startFrom
  }

  return (data?.[0]?.patient_number ?? startFrom - 1) + 1
}

/**
 * 患者番号の形式を判定
 *
 * @param input - 入力文字列
 * @returns 形式タイプ
 */
export function detectPatientNumberFormat(input: string): 'numeric' | 'alphanumeric' | 'text' {
  if (/^\d+$/.test(input)) {
    return 'numeric' // 数字のみ
  } else if (/\d/.test(input)) {
    return 'alphanumeric' // 文字と数字の混在
  } else {
    return 'text' // 文字のみ
  }
}

/**
 * 複数の患者番号を一括でチェック
 *
 * @param clinicId - クリニックID
 * @param patientNumbers - チェックする患者番号の配列
 * @returns 重複している患者番号の配列
 */
export async function checkMultiplePatientNumbers(
  clinicId: string,
  patientNumbers: number[]
): Promise<number[]> {
  if (patientNumbers.length === 0) return []

  const client = getSupabaseClient()

  const { data, error } = await client
    .from('patients')
    .select('patient_number')
    .eq('clinic_id', clinicId)
    .in('patient_number', patientNumbers)

  if (error) {
    console.error('複数患者番号チェックエラー:', error)
    return []
  }

  return data?.map(p => p.patient_number) ?? []
}
