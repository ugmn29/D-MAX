import { supabase } from '@/lib/supabase'

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
  const { data, error } = await supabase
    .from('mft_measurements')
    .select('*')
    .eq('patient_id', patientId)
    .order('measurement_date', { ascending: false })

  if (error) {
    console.log('Error fetching MFT measurements:', error)
    throw new Error(`Failed to fetch measurements: ${error.message}`)
  }

  return data || []
}

/**
 * MFT測定記録を作成
 */
export async function createMftMeasurement(
  input: CreateMftMeasurementInput
): Promise<MftMeasurement> {
  // BMIを自動計算
  const bmi = calculateBmi(input.height, input.weight)

  const { data, error } = await supabase
    .from('mft_measurements')
    .insert({
      ...input,
      bmi,
    })
    .select()
    .single()

  if (error) {
    console.log('Error creating MFT measurement:', error)
    throw new Error(`Failed to create measurement: ${error.message}`)
  }

  return data
}

/**
 * MFT測定記録を更新
 */
export async function updateMftMeasurement(
  id: string,
  input: UpdateMftMeasurementInput
): Promise<MftMeasurement> {
  // 身長・体重が更新された場合はBMIを再計算
  let updateData: any = { ...input }

  if (input.height !== undefined || input.weight !== undefined) {
    // 現在のデータを取得
    const { data: current } = await supabase
      .from('mft_measurements')
      .select('height, weight')
      .eq('id', id)
      .single()

    const height = input.height !== undefined ? input.height : current?.height
    const weight = input.weight !== undefined ? input.weight : current?.weight
    updateData.bmi = calculateBmi(height, weight)
  }

  const { data, error } = await supabase
    .from('mft_measurements')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.log('Error updating MFT measurement:', error)
    throw new Error(`Failed to update measurement: ${error.message}`)
  }

  return data
}

/**
 * MFT測定記録を削除
 */
export async function deleteMftMeasurement(id: string): Promise<void> {
  const { error } = await supabase.from('mft_measurements').delete().eq('id', id)

  if (error) {
    console.log('Error deleting MFT measurement:', error)
    throw new Error(`Failed to delete measurement: ${error.message}`)
  }
}
