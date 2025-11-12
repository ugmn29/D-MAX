// 電子カルテ (EMR) システム型定義
// Electronic Medical Record System Type Definitions

// ========================================
// マスターデータ型定義
// ========================================

/**
 * 診療行為マスター
 * Treatment Codes Master
 */
export interface TreatmentCode {
  id: string
  code: string // 9桁診療行為コード + 5桁加算コード
  name: string
  category: string
  points: number
  inclusion_rules: string[] // 包括される処置コード配列
  exclusion_rules: {
    same_day: string[] // 同日算定不可
    same_month: string[] // 同月算定不可
    simultaneous: string[] // 同時算定不可
    same_site: string[] // 同一部位同時算定不可
    same_week: string[] // 同週算定不可
  }
  frequency_limits: {
    period: 'day' | 'week' | 'month' | 'year'
    max_count: number
  }[]
  effective_from: string // date
  effective_to: string | null // date
  requires_documents: string[] // 必須文書コード
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TreatmentCodeInsert {
  id?: string
  code: string
  name: string
  category: string
  points: number
  inclusion_rules?: string[]
  exclusion_rules?: {
    same_day?: string[]
    same_month?: string[]
    simultaneous?: string[]
    same_site?: string[]
    same_week?: string[]
  }
  frequency_limits?: {
    period: 'day' | 'week' | 'month' | 'year'
    max_count: number
  }[]
  effective_from: string
  effective_to?: string | null
  requires_documents?: string[]
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface TreatmentCodeUpdate {
  id?: string
  code?: string
  name?: string
  category?: string
  points?: number
  inclusion_rules?: string[]
  exclusion_rules?: {
    same_day?: string[]
    same_month?: string[]
    simultaneous?: string[]
    same_site?: string[]
    same_week?: string[]
  }
  frequency_limits?: {
    period: 'day' | 'week' | 'month' | 'year'
    max_count: number
  }[]
  effective_from?: string
  effective_to?: string | null
  requires_documents?: string[]
  metadata?: Record<string, any>
  updated_at?: string
}

/**
 * 病名マスター
 * Disease Codes Master
 */
export interface DiseaseCode {
  id: string
  code: string // 病名コード
  name: string
  kana: string
  icd10_code: string
  category: string
  is_dental: boolean
  synonyms: string[]
  effective_from: string
  effective_to: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DiseaseCodeInsert {
  id?: string
  code: string
  name: string
  kana: string
  icd10_code: string
  category: string
  is_dental?: boolean
  synonyms?: string[]
  effective_from: string
  effective_to?: string | null
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface DiseaseCodeUpdate {
  id?: string
  code?: string
  name?: string
  kana?: string
  icd10_code?: string
  category?: string
  is_dental?: boolean
  synonyms?: string[]
  effective_from?: string
  effective_to?: string | null
  metadata?: Record<string, any>
  updated_at?: string
}

/**
 * 医薬品マスター
 * Medicine Codes Master
 */
export interface MedicineCode {
  id: string
  code: string
  name: string
  generic_name: string
  manufacturer: string
  unit: string
  price_per_unit: number
  category: string
  prescription_required: boolean
  effective_from: string
  effective_to: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface MedicineCodeInsert {
  id?: string
  code: string
  name: string
  generic_name: string
  manufacturer: string
  unit: string
  price_per_unit: number
  category: string
  prescription_required?: boolean
  effective_from: string
  effective_to?: string | null
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface MedicineCodeUpdate {
  id?: string
  code?: string
  name?: string
  generic_name?: string
  manufacturer?: string
  unit?: string
  price_per_unit?: number
  category?: string
  prescription_required?: boolean
  effective_from?: string
  effective_to?: string | null
  metadata?: Record<string, any>
  updated_at?: string
}

/**
 * 自費診療マスター
 * Self-Pay Treatment Master
 */
export interface SelfPayTreatment {
  id: string
  clinic_id: string
  code: string
  name: string
  description: string
  price: number
  tax_rate: number
  category: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface SelfPayTreatmentInsert {
  id?: string
  clinic_id: string
  code: string
  name: string
  description?: string
  price: number
  tax_rate?: number
  category: string
  is_active?: boolean
  display_order?: number
  created_at?: string
  updated_at?: string
}

export interface SelfPayTreatmentUpdate {
  id?: string
  clinic_id?: string
  code?: string
  name?: string
  description?: string
  price?: number
  tax_rate?: number
  category?: string
  is_active?: boolean
  display_order?: number
  updated_at?: string
}

/**
 * 施設マスター (訪問診療先)
 * Facility Master for Home Visit Treatment
 */
export interface Facility {
  id: string
  clinic_id: string
  code: string
  name: string
  type: string
  postal_code: string
  address: string
  phone: string
  contact_person: string
  notes: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FacilityInsert {
  id?: string
  clinic_id: string
  code: string
  name: string
  type: string
  postal_code?: string
  address?: string
  phone?: string
  contact_person?: string
  notes?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface FacilityUpdate {
  id?: string
  clinic_id?: string
  code?: string
  name?: string
  type?: string
  postal_code?: string
  address?: string
  phone?: string
  contact_person?: string
  notes?: string
  is_active?: boolean
  updated_at?: string
}

/**
 * 技工所マスター
 * Dental Laboratory Master
 */
export interface Lab {
  id: string
  clinic_id: string
  name: string
  postal_code: string
  address: string
  phone: string
  email: string
  contact_person: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LabInsert {
  id?: string
  clinic_id: string
  name: string
  postal_code?: string
  address?: string
  phone?: string
  email?: string
  contact_person?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface LabUpdate {
  id?: string
  clinic_id?: string
  name?: string
  postal_code?: string
  address?: string
  phone?: string
  email?: string
  contact_person?: string
  is_active?: boolean
  updated_at?: string
}

// ========================================
// 診療記録型定義
// ========================================

/**
 * 診療記録の病名情報
 */
export interface MedicalRecordDisease {
  disease_code_id: string
  onset_date: string | null
  is_primary: boolean
  status: 'active' | 'resolved'
  notes: string
}

/**
 * 診療記録の診療行為情報
 */
export interface MedicalRecordTreatment {
  treatment_code_id: string
  tooth_numbers: number[]
  quantity: number
  points: number
  notes: string
  operator_id: string
}

/**
 * 診療記録の処方情報
 */
export interface MedicalRecordPrescription {
  medicine_code_id: string
  quantity: number
  dosage: string
  days: number
  notes: string
}

/**
 * 診療記録の自費診療情報
 */
export interface MedicalRecordSelfPayItem {
  self_pay_treatment_id: string
  quantity: number
  unit_price: number
  subtotal: number
  tax: number
  total: number
  notes: string
}

/**
 * 診療記録
 * Medical Record
 */
export interface MedicalRecord {
  id: string
  patient_id: string
  clinic_id: string
  visit_date: string // date
  visit_type: 'initial' | 'regular' | 'emergency' | 'home_visit'
  facility_id: string | null

  // 病名情報
  diseases: MedicalRecordDisease[]

  // 診療内容
  treatments: MedicalRecordTreatment[]

  // 処方
  prescriptions: MedicalRecordPrescription[]

  // 自費診療
  self_pay_items: MedicalRecordSelfPayItem[]

  // 計算結果
  total_points: number
  total_insurance_amount: number
  patient_copay_amount: number
  self_pay_amount: number

  // SOAP記録
  subjective: string
  objective: string
  assessment: string
  plan: string

  // 関連情報
  related_document_ids: string[]
  treatment_plan_id: string | null
  receipt_id: string | null

  // メタデータ
  created_by: string
  created_at: string
  updated_by: string
  updated_at: string

  // 監査ログ
  version: number
  snapshot_data: Record<string, any>
}

export interface MedicalRecordInsert {
  id?: string
  patient_id: string
  clinic_id: string
  visit_date: string
  visit_type: 'initial' | 'regular' | 'emergency' | 'home_visit'
  facility_id?: string | null
  diseases?: MedicalRecordDisease[]
  treatments?: MedicalRecordTreatment[]
  prescriptions?: MedicalRecordPrescription[]
  self_pay_items?: MedicalRecordSelfPayItem[]
  total_points?: number
  total_insurance_amount?: number
  patient_copay_amount?: number
  self_pay_amount?: number
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  related_document_ids?: string[]
  treatment_plan_id?: string | null
  receipt_id?: string | null
  created_by: string
  created_at?: string
  updated_by?: string
  updated_at?: string
  version?: number
  snapshot_data?: Record<string, any>
}

export interface MedicalRecordUpdate {
  id?: string
  patient_id?: string
  clinic_id?: string
  visit_date?: string
  visit_type?: 'initial' | 'regular' | 'emergency' | 'home_visit'
  facility_id?: string | null
  diseases?: MedicalRecordDisease[]
  treatments?: MedicalRecordTreatment[]
  prescriptions?: MedicalRecordPrescription[]
  self_pay_items?: MedicalRecordSelfPayItem[]
  total_points?: number
  total_insurance_amount?: number
  patient_copay_amount?: number
  self_pay_amount?: number
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  related_document_ids?: string[]
  treatment_plan_id?: string | null
  receipt_id?: string | null
  updated_by?: string
  updated_at?: string
  version?: number
  snapshot_data?: Record<string, any>
}

/**
 * 治療計画の予定診療行為
 */
export interface PlannedTreatment {
  treatment_code_id: string
  tooth_numbers: number[]
  sequence: number
  estimated_date: string | null
  completed_date: string | null
  medical_record_id: string | null
  notes: string
}

/**
 * 治療計画
 * Treatment Plan
 */
export interface TreatmentPlan {
  id: string
  patient_id: string
  clinic_id: string
  title: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  planned_treatments: PlannedTreatment[]
  estimated_total_points: number
  estimated_insurance_amount: number
  estimated_patient_amount: number
  estimated_self_pay_amount: number
  created_by: string
  created_at: string
  updated_by: string
  updated_at: string
}

export interface TreatmentPlanInsert {
  id?: string
  patient_id: string
  clinic_id: string
  title: string
  status?: 'draft' | 'active' | 'completed' | 'cancelled'
  planned_treatments?: PlannedTreatment[]
  estimated_total_points?: number
  estimated_insurance_amount?: number
  estimated_patient_amount?: number
  estimated_self_pay_amount?: number
  created_by: string
  created_at?: string
  updated_by?: string
  updated_at?: string
}

export interface TreatmentPlanUpdate {
  id?: string
  patient_id?: string
  clinic_id?: string
  title?: string
  status?: 'draft' | 'active' | 'completed' | 'cancelled'
  planned_treatments?: PlannedTreatment[]
  estimated_total_points?: number
  estimated_insurance_amount?: number
  estimated_patient_amount?: number
  estimated_self_pay_amount?: number
  updated_by?: string
  updated_at?: string
}

/**
 * レセプト検証エラー
 */
export interface ReceiptValidationError {
  rule_id: string
  severity: 'error' | 'warning'
  message: string
  field: string
}

/**
 * レセプト審査結果
 */
export interface ReceiptAuditResult {
  status: 'approved' | 'reduced' | 'rejected'
  reduced_amount: number
  rejection_reason: string
  inquiry_details: string
  response_details: string
  response_submitted_at: string | null
}

/**
 * レセプト
 * Receipt (Medical Claim)
 */
export interface Receipt {
  id: string
  clinic_id: string
  patient_id: string
  year_month: string // 'YYYY-MM'
  medical_record_ids: string[]
  total_points: number
  total_amount: number
  insurance_amount: number
  patient_amount: number
  status: 'draft' | 'validated' | 'submitted' | 'approved' | 'rejected' | 'resubmitted'
  validation_errors: ReceiptValidationError[]
  submitted_at: string | null
  submission_file_path: string | null
  receipt_number: string | null
  audit_result: ReceiptAuditResult | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ReceiptInsert {
  id?: string
  clinic_id: string
  patient_id: string
  year_month: string
  medical_record_ids?: string[]
  total_points?: number
  total_amount?: number
  insurance_amount?: number
  patient_amount?: number
  status?: 'draft' | 'validated' | 'submitted' | 'approved' | 'rejected' | 'resubmitted'
  validation_errors?: ReceiptValidationError[]
  submitted_at?: string | null
  submission_file_path?: string | null
  receipt_number?: string | null
  audit_result?: ReceiptAuditResult | null
  created_by: string
  created_at?: string
  updated_at?: string
}

export interface ReceiptUpdate {
  id?: string
  clinic_id?: string
  patient_id?: string
  year_month?: string
  medical_record_ids?: string[]
  total_points?: number
  total_amount?: number
  insurance_amount?: number
  patient_amount?: number
  status?: 'draft' | 'validated' | 'submitted' | 'approved' | 'rejected' | 'resubmitted'
  validation_errors?: ReceiptValidationError[]
  submitted_at?: string | null
  submission_file_path?: string | null
  receipt_number?: string | null
  audit_result?: ReceiptAuditResult | null
  updated_at?: string
}

/**
 * 技工指示書項目
 */
export interface LabOrderItem {
  type: string
  tooth_numbers: number[]
  material: string
  shade: string
  instructions: string
  price: number
}

/**
 * 技工指示書
 * Lab Order
 */
export interface LabOrder {
  id: string
  clinic_id: string
  patient_id: string
  medical_record_id: string
  lab_id: string
  order_date: string
  due_date: string
  completed_date: string | null
  items: LabOrderItem[]
  total_cost: number
  status: 'ordered' | 'in_progress' | 'completed' | 'delivered'
  created_by: string
  created_at: string
  updated_at: string
}

export interface LabOrderInsert {
  id?: string
  clinic_id: string
  patient_id: string
  medical_record_id: string
  lab_id: string
  order_date: string
  due_date: string
  completed_date?: string | null
  items?: LabOrderItem[]
  total_cost?: number
  status?: 'ordered' | 'in_progress' | 'completed' | 'delivered'
  created_by: string
  created_at?: string
  updated_at?: string
}

export interface LabOrderUpdate {
  id?: string
  clinic_id?: string
  patient_id?: string
  medical_record_id?: string
  lab_id?: string
  order_date?: string
  due_date?: string
  completed_date?: string | null
  items?: LabOrderItem[]
  total_cost?: number
  status?: 'ordered' | 'in_progress' | 'completed' | 'delivered'
  updated_at?: string
}

// ========================================
// 検証・計算関連型定義
// ========================================

/**
 * 点数計算リクエスト
 */
export interface PointCalculationRequest {
  visit_date: string
  treatments: {
    code: string
    tooth_numbers: number[]
    quantity: number
  }[]
  existing_record_ids?: string[] // 同日・同月チェック用
}

/**
 * 点数計算結果
 */
export interface PointCalculationResult {
  total_points: number
  breakdown: {
    treatment_code_id: string
    code: string
    name: string
    base_points: number
    calculated_points: number
    quantity: number
  }[]
  warnings: {
    type: 'inclusion' | 'exclusion' | 'frequency_limit'
    message: string
    affected_codes: string[]
  }[]
  errors: {
    type: 'validation_error'
    message: string
    code: string
  }[]
}

/**
 * レセプト検証リクエスト
 */
export interface ReceiptValidationRequest {
  receipt_id: string
}

/**
 * レセプト検証結果
 */
export interface ReceiptValidationResult {
  is_valid: boolean
  errors: ReceiptValidationError[]
  warnings: ReceiptValidationError[]
}

// ========================================
// 拡張型定義 (JOIN結果など)
// ========================================

/**
 * 診療記録 with 関連データ
 */
export interface MedicalRecordWithRelations extends MedicalRecord {
  patient?: {
    id: string
    name: string
    name_kana: string
  }
  diseases_detail?: Array<
    MedicalRecordDisease & {
      disease: DiseaseCode
    }
  >
  treatments_detail?: Array<
    MedicalRecordTreatment & {
      treatment: TreatmentCode
      operator?: {
        id: string
        name: string
      }
    }
  >
  prescriptions_detail?: Array<
    MedicalRecordPrescription & {
      medicine: MedicineCode
    }
  >
  self_pay_items_detail?: Array<
    MedicalRecordSelfPayItem & {
      treatment: SelfPayTreatment
    }
  >
}

/**
 * レセプト with 関連データ
 */
export interface ReceiptWithRelations extends Receipt {
  patient?: {
    id: string
    name: string
    name_kana: string
  }
  medical_records?: MedicalRecordWithRelations[]
}
