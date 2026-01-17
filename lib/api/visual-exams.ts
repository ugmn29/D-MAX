// 型定義
export type ToothStatus =
  | 'healthy'
  | 'caries'
  | 'restoration'
  | 'missing'
  | 'extraction_required'
  | 'unerupted'
  | 'none'
  | 'impacted'
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
  const response = await fetch('/api/visual-examinations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create visual examination')
  }

  return response.json()
}

// 患者の視診検査一覧を取得
export async function getVisualExaminations(patientId: string): Promise<VisualExamination[]> {
  const response = await fetch(`/api/visual-examinations?patient_id=${patientId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch visual examinations')
  }

  return response.json()
}

// 特定の視診検査を取得
export async function getVisualExamination(examinationId: string): Promise<VisualExamination> {
  const response = await fetch(`/api/visual-examinations/${examinationId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch visual examination')
  }

  return response.json()
}

// 視診検査を更新
export async function updateVisualExamination(
  examinationId: string,
  input: Partial<CreateVisualExaminationInput>
): Promise<VisualExamination> {
  const response = await fetch(`/api/visual-examinations/${examinationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update visual examination')
  }

  return response.json()
}

// 視診検査を削除
export async function deleteVisualExamination(examinationId: string): Promise<void> {
  const response = await fetch(`/api/visual-examinations/${examinationId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete visual examination')
  }
}

// 最新の視診検査を取得
export async function getLatestVisualExamination(patientId: string): Promise<VisualExamination | null> {
  const response = await fetch(`/api/visual-examinations/latest?patient_id=${patientId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch latest visual examination')
  }

  const data = await response.json()
  return data || null
}

// 永久歯の歯番号リスト（FDI方式）
const PERMANENT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

// 患者の最新の視診データから入力不可の歯番号を取得
// P検査では永久歯のみが対象なので、欠損・未萌出・要抜歯の永久歯のみを返す
export async function getMissingTeeth(patientId: string): Promise<Set<number>> {
  const latestExam = await getLatestVisualExamination(patientId)

  if (!latestExam || !latestExam.tooth_data) {
    return new Set()
  }

  const missingTeeth = latestExam.tooth_data
    .filter(tooth => {
      // 永久歯のみを対象
      if (!PERMANENT_TEETH.includes(tooth.tooth_number)) {
        return false
      }
      // 欠損、未萌出、要抜歯の歯を入力不可とする
      return tooth.status === 'missing' ||
             tooth.status === 'unerupted' ||
             tooth.status === 'extraction_required'
    })
    .map(tooth => tooth.tooth_number)

  return new Set(missingTeeth)
}
