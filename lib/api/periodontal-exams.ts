// Migrated to Prisma API Routes

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

export type MeasurementType = '6point' | '4point' | '1point'

export type ExaminationPhase = 'P_EXAM_1' | 'P_EXAM_2' | 'P_EXAM_3' | 'P_EXAM_4' | 'P_EXAM_5' | 'SPT' | 'OTHER'

// 歯周検査データの型定義
export interface PeriodontalExam {
  id: string
  patient_id: string
  clinic_id: string
  examination_date: string
  examiner_id?: string
  measurement_type: MeasurementType
  examination_phase?: ExaminationPhase
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
  examination_phase?: ExaminationPhase
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
  const response = await fetch(`${baseUrl}/api/periodontal-exams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create periodontal examination')
  }

  return response.json()
}

/**
 * 患者の歯周検査履歴を取得
 */
export async function getPeriodontalExams(patientId: string): Promise<PeriodontalExam[]> {
  const response = await fetch(`${baseUrl}/api/periodontal-exams?patient_id=${patientId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch periodontal examinations')
  }

  return response.json()
}

/**
 * 特定の歯周検査を取得（歯ごとのデータを含む）
 */
export async function getPeriodontalExam(examId: string): Promise<PeriodontalExam> {
  const response = await fetch(`${baseUrl}/api/periodontal-exams/${examId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch periodontal examination')
  }

  return response.json()
}

/**
 * 歯周検査を更新
 */
export async function updatePeriodontalExam(
  examId: string,
  input: UpdatePeriodontalExamInput
): Promise<PeriodontalExam> {
  const response = await fetch(`${baseUrl}/api/periodontal-exams/${examId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update periodontal examination')
  }

  return response.json()
}

/**
 * 歯周検査を削除
 */
export async function deletePeriodontalExam(examId: string): Promise<void> {
  const response = await fetch(`${baseUrl}/api/periodontal-exams/${examId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete periodontal examination')
  }
}

/**
 * 患者の最新の歯周検査を取得（前回値コピー用）
 */
export async function getLatestPeriodontalExam(patientId: string): Promise<PeriodontalExam | null> {
  const response = await fetch(`${baseUrl}/api/periodontal-exams/latest?patient_id=${encodeURIComponent(patientId)}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch latest periodontal examination')
  }

  return response.json()
}
