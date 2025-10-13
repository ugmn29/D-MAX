import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const createClient = (): SupabaseClient<Database> => {
  // 開発環境ではsupabaseAdminを使用してRLSをバイパス
  if (process.env.NODE_ENV === 'development' && supabaseAdmin) {
    return supabaseAdmin
  }
  return supabase
}

// 型定義
export type ToothStatus = 'healthy' | 'caries' | 'restoration' | 'missing' | 'extraction_required' | 'unerupted'
export type CariesLevel = 'CO' | 'C1' | 'C2' | 'C3' | 'C4'
export type RestorationType = 'inlay' | 'crown' | 'bridge'
export type MaterialType = 'ceramic' | 'metal' | 'cad' | 'hr'

export interface VisualToothData {
  id?: string
  examination_id?: string
  tooth_number: number
  status: ToothStatus
  caries_level?: CariesLevel
  restoration_type?: RestorationType
  material_type?: MaterialType
  notes?: string
  created_at?: string
}

export interface VisualExamination {
  id: string
  patient_id: string
  clinic_id: string
  examination_date: string
  notes?: string
  created_at: string
  updated_at: string
  tooth_data?: VisualToothData[]
}

export interface CreateVisualExaminationInput {
  patient_id: string
  clinic_id: string
  examination_date?: string
  notes?: string
  tooth_data: Omit<VisualToothData, 'id' | 'examination_id' | 'created_at'>[]
}

// 視診検査を作成
export async function createVisualExamination(input: CreateVisualExaminationInput): Promise<VisualExamination> {
  const client = createClient()

  // 視診検査レコードを作成
  const { data: exam, error: examError } = await client
    .from('visual_examinations')
    .insert({
      patient_id: input.patient_id,
      clinic_id: input.clinic_id,
      examination_date: input.examination_date || new Date().toISOString(),
      notes: input.notes,
    })
    .select()
    .single()

  if (examError) throw examError

  // 歯牙データを作成
  const toothDataWithExamId = input.tooth_data.map(tooth => ({
    ...tooth,
    examination_id: exam.id,
  }))

  const { data: toothData, error: toothError } = await client
    .from('visual_tooth_data')
    .insert(toothDataWithExamId)
    .select()

  if (toothError) throw toothError

  return {
    ...exam,
    tooth_data: toothData,
  }
}

// 患者の視診検査一覧を取得
export async function getVisualExaminations(patientId: string): Promise<VisualExamination[]> {
  const client = createClient()

  const { data: exams, error: examsError } = await client
    .from('visual_examinations')
    .select('*')
    .eq('patient_id', patientId)
    .order('examination_date', { ascending: false })

  if (examsError) throw examsError

  // 各検査の歯牙データを取得
  const examsWithToothData = await Promise.all(
    exams.map(async (exam) => {
      const { data: toothData } = await client
        .from('visual_tooth_data')
        .select('*')
        .eq('examination_id', exam.id)
        .order('tooth_number')

      return {
        ...exam,
        tooth_data: toothData || [],
      }
    })
  )

  return examsWithToothData
}

// 特定の視診検査を取得
export async function getVisualExamination(examinationId: string): Promise<VisualExamination> {
  const client = createClient()

  const { data: exam, error: examError } = await client
    .from('visual_examinations')
    .select('*')
    .eq('id', examinationId)
    .single()

  if (examError) throw examError

  const { data: toothData, error: toothError } = await client
    .from('visual_tooth_data')
    .select('*')
    .eq('examination_id', examinationId)
    .order('tooth_number')

  if (toothError) throw toothError

  return {
    ...exam,
    tooth_data: toothData,
  }
}

// 視診検査を更新
export async function updateVisualExamination(
  examinationId: string,
  input: Partial<CreateVisualExaminationInput>
): Promise<VisualExamination> {
  const client = createClient()

  // 検査レコードを更新
  const { data: exam, error: examError } = await client
    .from('visual_examinations')
    .update({
      examination_date: input.examination_date,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', examinationId)
    .select()
    .single()

  if (examError) throw examError

  // 歯牙データを更新する場合
  if (input.tooth_data) {
    // 既存の歯牙データを削除
    await client.from('visual_tooth_data').delete().eq('examination_id', examinationId)

    // 新しい歯牙データを挿入
    const toothDataWithExamId = input.tooth_data.map(tooth => ({
      ...tooth,
      examination_id: examinationId,
    }))

    const { data: toothData, error: toothError } = await client
      .from('visual_tooth_data')
      .insert(toothDataWithExamId)
      .select()

    if (toothError) throw toothError

    return {
      ...exam,
      tooth_data: toothData,
    }
  }

  // 既存の歯牙データを取得
  const { data: toothData } = await client
    .from('visual_tooth_data')
    .select('*')
    .eq('examination_id', examinationId)
    .order('tooth_number')

  return {
    ...exam,
    tooth_data: toothData || [],
  }
}

// 視診検査を削除
export async function deleteVisualExamination(examinationId: string): Promise<void> {
  const client = createClient()

  // 歯牙データは ON DELETE CASCADE で自動削除される
  const { error } = await client.from('visual_examinations').delete().eq('id', examinationId)

  if (error) throw error
}

// 最新の視診検査を取得
export async function getLatestVisualExamination(patientId: string): Promise<VisualExamination | null> {
  const client = createClient()

  const { data: exam, error: examError } = await client
    .from('visual_examinations')
    .select('*')
    .eq('patient_id', patientId)
    .order('examination_date', { ascending: false })
    .limit(1)
    .single()

  if (examError) {
    if (examError.code === 'PGRST116') return null // No rows found
    throw examError
  }

  const { data: toothData } = await client
    .from('visual_tooth_data')
    .select('*')
    .eq('examination_id', exam.id)
    .order('tooth_number')

  return {
    ...exam,
    tooth_data: toothData || [],
  }
}

// 患者の最新の視診データから欠損歯の歯番号を取得
export async function getMissingTeeth(patientId: string): Promise<Set<number>> {
  const latestExam = await getLatestVisualExamination(patientId)

  if (!latestExam || !latestExam.tooth_data) {
    return new Set()
  }

  const missingTeeth = latestExam.tooth_data
    .filter(tooth => tooth.status === 'missing')
    .map(tooth => tooth.tooth_number)

  return new Set(missingTeeth)
}
