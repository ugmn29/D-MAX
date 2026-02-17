// Migrated to Prisma API Routes

export interface MftMeasurement {
  id: string
  patient_id: string
  clinic_id: string
  measurement_date: string
  height?: number | null
  weight?: number | null
  bmi?: number | null
  lip_seal_strength?: number | null
  tongue_pressure?: number | null
  max_mouth_opening?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
}

export interface CreateMftMeasurementInput {
  patient_id: string
  clinic_id: string
  measurement_date?: string
  height?: number | null
  weight?: number | null
  lip_seal_strength?: number | null
  tongue_pressure?: number | null
  max_mouth_opening?: number | null
  notes?: string | null
  created_by?: string | null
}

export interface UpdateMftMeasurementInput {
  measurement_date?: string
  height?: number | null
  weight?: number | null
  lip_seal_strength?: number | null
  tongue_pressure?: number | null
  max_mouth_opening?: number | null
  notes?: string | null
  updated_by?: string | null
}

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * BMIを計算する
 */
export function calculateBmi(height?: number | null, weight?: number | null): number | null {
  if (!height || !weight || height <= 0) return null
  const heightInMeters = height / 100
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10
}

/**
 * 患者のMFT測定記録一覧を取得
 */
export async function getMftMeasurements(patientId: string): Promise<MftMeasurement[]> {
  try {
    const response = await fetch(`${baseUrl}/api/mft-measurements?patient_id=${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to fetch measurements')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching MFT measurements:', error)
    throw error
  }
}

/**
 * MFT測定記録を作成
 */
export async function createMftMeasurement(
  input: CreateMftMeasurementInput
): Promise<MftMeasurement> {
  try {
    const response = await fetch(`${baseUrl}/api/mft-measurements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to create measurement')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating MFT measurement:', error)
    throw error
  }
}

/**
 * MFT測定記録を更新
 */
export async function updateMftMeasurement(
  id: string,
  input: UpdateMftMeasurementInput
): Promise<MftMeasurement> {
  try {
    const response = await fetch(`${baseUrl}/api/mft-measurements`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, ...input })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update measurement')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating MFT measurement:', error)
    throw error
  }
}

/**
 * MFT測定記録を削除
 */
export async function deleteMftMeasurement(id: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/mft-measurements?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to delete measurement')
    }
  } catch (error) {
    console.error('Error deleting MFT measurement:', error)
    throw error
  }
}
