// Migrated to Prisma API Routes

/**
 * 患者番号解析オプション
 */
export interface PatientNumberParseOptions {
  preserveLeadingZeros?: boolean // 先頭ゼロを保持するか
}

/**
 * 患者番号を解析して数値化
 */
export function parsePatientNumber(
  input: string,
  options: PatientNumberParseOptions = {}
): number | null {
  if (!input || typeof input !== 'string') return null
  const numbers = input.replace(/[^\d]/g, '')
  if (!numbers) return null
  const parsed = parseInt(numbers, 10)
  return isNaN(parsed) ? null : parsed
}

/**
 * 患者番号が既に存在するかチェック
 */
export async function checkPatientNumberExists(
  clinicId: string,
  patientNumber: number
): Promise<boolean> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({
      clinic_id: clinicId,
      action: 'check_exists',
      patient_number: patientNumber.toString()
    })

    const response = await fetch(`${baseUrl}/api/patient-numbers?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      console.error('患者番号チェックエラー')
      return false
    }

    const data = await response.json()
    return data.exists
  } catch (error) {
    console.error('患者番号チェックエラー:', error)
    return false
  }
}

/**
 * 利用可能な次の患者番号を取得
 */
export async function getNextAvailablePatientNumber(
  clinicId: string,
  startFrom: number = 10000
): Promise<number> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({
      clinic_id: clinicId,
      action: 'next_available',
      start_from: startFrom.toString()
    })

    const response = await fetch(`${baseUrl}/api/patient-numbers?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      console.error('次の患者番号取得エラー')
      return startFrom
    }

    const data = await response.json()
    return data.next_number
  } catch (error) {
    console.error('次の患者番号取得エラー:', error)
    return startFrom
  }
}

/**
 * 患者番号の形式を判定
 */
export function detectPatientNumberFormat(input: string): 'numeric' | 'alphanumeric' | 'text' {
  if (/^\d+$/.test(input)) {
    return 'numeric'
  } else if (/\d/.test(input)) {
    return 'alphanumeric'
  } else {
    return 'text'
  }
}

/**
 * 複数の患者番号を一括でチェック
 */
export async function checkMultiplePatientNumbers(
  clinicId: string,
  patientNumbers: number[]
): Promise<number[]> {
  if (patientNumbers.length === 0) return []

  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({
      clinic_id: clinicId,
      action: 'check_multiple',
      numbers: patientNumbers.join(',')
    })

    const response = await fetch(`${baseUrl}/api/patient-numbers?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      console.error('複数患者番号チェックエラー')
      return []
    }

    const data = await response.json()
    return data.duplicates ?? []
  } catch (error) {
    console.error('複数患者番号チェックエラー:', error)
    return []
  }
}
