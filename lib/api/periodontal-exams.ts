import { supabase } from '@/lib/supabase'

export type MeasurementType = '6point' | '4point' | '1point'

// Supabaseクライアント取得関数
const createClient = () => supabase

// 歯周検査データの型定義
export interface PeriodontalExam {
  id: string
  patient_id: string
  clinic_id: string
  examination_date: string
  examiner_id?: string
  measurement_type: MeasurementType
  notes?: string
  created_at: string
  updated_at: string
  tooth_data?: PeriodontalToothData[]
}

// 歯ごとのデータ
export interface PeriodontalToothData {
  id?: string
  examination_id?: string
  tooth_number: number

  // プラークコントロール（4部位）
  plaque_top: boolean
  plaque_right: boolean
  plaque_bottom: boolean
  plaque_left: boolean

  is_missing: boolean
  mobility?: number

  // PPD（6点法）
  ppd_mb?: number
  ppd_b?: number
  ppd_db?: number
  ppd_ml?: number
  ppd_l?: number
  ppd_dl?: number

  // BOP（6点）
  bop_mb: boolean
  bop_b: boolean
  bop_db: boolean
  bop_ml: boolean
  bop_l: boolean
  bop_dl: boolean

  // 排膿（6点）
  pus_mb: boolean
  pus_b: boolean
  pus_db: boolean
  pus_ml: boolean
  pus_l: boolean
  pus_dl: boolean
}

// 新規作成用の入力データ
export interface CreatePeriodontalExamInput {
  patient_id: string
  clinic_id: string
  examination_date?: string
  examiner_id?: string
  measurement_type: MeasurementType
  notes?: string
  tooth_data: PeriodontalToothData[]
}

// 更新用の入力データ
export interface UpdatePeriodontalExamInput {
  examination_date?: string
  measurement_type?: MeasurementType
  notes?: string
  tooth_data?: PeriodontalToothData[]
}

/**
 * 新規歯周検査を作成
 */
export async function createPeriodontalExam(input: CreatePeriodontalExamInput): Promise<PeriodontalExam> {
  const supabase = createClient()

  // 検査レコードを作成
  const { data: exam, error: examError } = await supabase
    .from('periodontal_examinations')
    .insert({
      patient_id: input.patient_id,
      clinic_id: input.clinic_id,
      examination_date: input.examination_date || new Date().toISOString().split('T')[0],
      examiner_id: input.examiner_id,
      measurement_type: input.measurement_type,
      notes: input.notes,
    })
    .select()
    .single()

  if (examError) {
    throw new Error(`Failed to create periodontal examination: ${examError.message}`)
  }

  // 歯ごとのデータを作成
  if (input.tooth_data && input.tooth_data.length > 0) {
    const toothDataToInsert = input.tooth_data.map(tooth => ({
      examination_id: exam.id,
      ...tooth,
    }))

    const { error: toothError } = await supabase
      .from('periodontal_tooth_data')
      .insert(toothDataToInsert)

    if (toothError) {
      // エラーが発生した場合、検査レコードも削除
      await supabase.from('periodontal_examinations').delete().eq('id', exam.id)
      throw new Error(`Failed to create tooth data: ${toothError.message}`)
    }
  }

  return exam
}

/**
 * 患者の歯周検査履歴を取得
 */
export async function getPeriodontalExams(patientId: string): Promise<PeriodontalExam[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('periodontal_examinations')
    .select('*')
    .eq('patient_id', patientId)
    .order('examination_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch periodontal examinations: ${error.message}`)
  }

  return data || []
}

/**
 * 特定の歯周検査を取得（歯ごとのデータを含む）
 */
export async function getPeriodontalExam(examId: string): Promise<PeriodontalExam> {
  const supabase = createClient()

  // 検査レコードを取得
  const { data: exam, error: examError } = await supabase
    .from('periodontal_examinations')
    .select('*')
    .eq('id', examId)
    .single()

  if (examError) {
    throw new Error(`Failed to fetch periodontal examination: ${examError.message}`)
  }

  // 歯ごとのデータを取得
  const { data: toothData, error: toothError } = await supabase
    .from('periodontal_tooth_data')
    .select('*')
    .eq('examination_id', examId)
    .order('tooth_number')

  if (toothError) {
    throw new Error(`Failed to fetch tooth data: ${toothError.message}`)
  }

  return {
    ...exam,
    tooth_data: toothData || [],
  }
}

/**
 * 歯周検査を更新
 */
export async function updatePeriodontalExam(
  examId: string,
  input: UpdatePeriodontalExamInput
): Promise<PeriodontalExam> {
  const supabase = createClient()

  // 検査レコードを更新
  const updateData: any = {}
  if (input.examination_date !== undefined) updateData.examination_date = input.examination_date
  if (input.measurement_type !== undefined) updateData.measurement_type = input.measurement_type
  if (input.notes !== undefined) updateData.notes = input.notes

  const { data: exam, error: examError } = await supabase
    .from('periodontal_examinations')
    .update(updateData)
    .eq('id', examId)
    .select()
    .single()

  if (examError) {
    throw new Error(`Failed to update periodontal examination: ${examError.message}`)
  }

  // 歯ごとのデータを更新
  if (input.tooth_data) {
    // 既存のデータを削除
    await supabase
      .from('periodontal_tooth_data')
      .delete()
      .eq('examination_id', examId)

    // 新しいデータを挿入
    if (input.tooth_data.length > 0) {
      const toothDataToInsert = input.tooth_data.map(tooth => ({
        examination_id: examId,
        ...tooth,
      }))

      const { error: toothError } = await supabase
        .from('periodontal_tooth_data')
        .insert(toothDataToInsert)

      if (toothError) {
        throw new Error(`Failed to update tooth data: ${toothError.message}`)
      }
    }
  }

  return exam
}

/**
 * 歯周検査を削除
 */
export async function deletePeriodontalExam(examId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('periodontal_examinations')
    .delete()
    .eq('id', examId)

  if (error) {
    throw new Error(`Failed to delete periodontal examination: ${error.message}`)
  }
}

/**
 * 患者の最新の歯周検査を取得（前回値コピー用）
 */
export async function getLatestPeriodontalExam(patientId: string): Promise<PeriodontalExam | null> {
  const supabase = createClient()

  // 最新の検査レコードを取得
  const { data: exam, error: examError } = await supabase
    .from('periodontal_examinations')
    .select('*')
    .eq('patient_id', patientId)
    .order('examination_date', { ascending: false })
    .limit(1)
    .single()

  if (examError) {
    if (examError.code === 'PGRST116') {
      // データが見つからない場合
      return null
    }
    throw new Error(`Failed to fetch latest periodontal examination: ${examError.message}`)
  }

  // 歯ごとのデータを取得
  const { data: toothData, error: toothError } = await supabase
    .from('periodontal_tooth_data')
    .select('*')
    .eq('examination_id', exam.id)
    .order('tooth_number')

  if (toothError) {
    throw new Error(`Failed to fetch tooth data: ${toothError.message}`)
  }

  return {
    ...exam,
    tooth_data: toothData || [],
  }
}
