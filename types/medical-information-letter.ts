// 診療情報提供書のタイプ定義

export type MedicalInformationLetterType =
  | '診療情報提供料(I)'
  | '診療情報提供料(II)'
  | '診療情報等連携共有料1'
  | '診療情報等連携共有料2'

// 基本情報（全タイプ共通）
export interface BaseInformationData {
  documentDate: string
  documentType: MedicalInformationLetterType

  // 患者基本情報
  patientNumber: string
  patientName: string
  patientNameKana: string
  gender: string
  birthDate: string
  age: string
  address: string
  phone: string

  // 紹介元情報
  clinicName: string
  clinicAddress: string
  clinicPhone: string
  dentistName: string
}

// 診療情報提供料(I) - 他医療機関への紹介
export interface ReferralLetterType1Data extends BaseInformationData {
  documentType: '診療情報提供料(I)'

  // 紹介先情報
  referToInstitution: string
  referToDoctor: string
  referToDepartment: string

  // 医療情報
  chiefComplaint: string // 主訴
  diagnosis: string // 傷病名
  referralReason: string // 紹介目的・紹介理由
  presentIllness: string // 現病歴
  pastMedicalHistory: string // 既往歴
  familyHistory: string // 家族歴
  clinicalSummary: string // 症状経過
  treatmentHistory: string // 治療経過
  medications: string // 投薬内容
  examResults: string // 検査結果
  requestedExam: string // 依頼事項
  remarks: string // 備考
}

// 診療情報提供料(II) - セカンドオピニオン
export interface ReferralLetterType2Data extends BaseInformationData {
  documentType: '診療情報提供料(II)'

  // セカンドオピニオン特有
  patientRequest: string // 患者の申し出内容
  requestedDate: string // 申し出があった日
  consultationPurpose: string // 相談目的

  // 医療情報（詳細）
  chiefComplaint: string
  diagnosis: string // 確定診断名
  diseaseStage: string // 病期・ステージ
  presentIllness: string
  pastMedicalHistory: string
  familyHistory: string

  // 治療計画
  currentTreatmentPlan: string // 現在の治療方針
  treatmentOptions: string // 治療選択肢
  treatmentHistory: string // 治療歴の詳細
  medications: string // 現在の投薬内容

  // 検査・画像
  examResults: string // 検査結果の詳細
  imageInformation: string // 画像情報

  remarks: string
}

// 診療情報等連携共有料1 - 歯科→医科への照会
export interface CollaborationInquiryData extends BaseInformationData {
  documentType: '診療情報等連携共有料1'

  // 照会先情報
  requestedInstitution: string // 照会先医療機関名または保険薬局名
  requestedDoctor: string // 照会先担当医名または薬剤師名
  requestedInstitutionType: '医科機関' | '保険薬局' // 照会先種別

  // 照会内容
  inquiryType: '文書' | '電話' | 'メール' | 'FAX' // 照会方法
  inquiryPurpose: string // 照会目的
  systemicManagementReason: string // 全身的管理が必要な理由
  diagnosis: string // 傷病名
  treatmentPolicy: string // 治療方針

  // 求める情報
  requestedInformation: string[] // 検査結果、投薬内容、服用薬の情報など
  requestedInformationDetail: string // 求める情報の詳細

  remarks: string
}

// 診療情報等連携共有料2 - 医科→歯科への回答
export interface CollaborationResponseData extends BaseInformationData {
  documentType: '診療情報等連携共有料2'

  // 依頼元情報
  requestingInstitution: string // 依頼元医療機関名
  requestingDoctor: string // 依頼元医師名
  requestedDate: string // 依頼を受けた日

  // 歯科診療情報
  chiefComplaint: string // 主訴
  dentalDiagnosis: string // 診断名（歯科）
  dentalFindings: string // 口腔内所見
  dentalTreatmentStatus: string // 歯科治療状況
  treatmentHistory: string // 治療経過
  medications: string // 処方内容（歯科）
  examResults: string // 歯科検査結果
  precautions: string // 留意事項・注意事項

  remarks: string
}

// すべての診療情報提供書データの型
export type MedicalInformationLetterData =
  | ReferralLetterType1Data
  | ReferralLetterType2Data
  | CollaborationInquiryData
  | CollaborationResponseData

// タイプ情報
export interface MedicalInformationLetterTypeInfo {
  type: MedicalInformationLetterType
  label: string
  code: string
  points: number
  frequency: string
  description: string
  icon: string
}

export const MEDICAL_INFORMATION_LETTER_TYPES: MedicalInformationLetterTypeInfo[] = [
  {
    type: '診療情報提供料(I)',
    label: '診療情報提供料(I)',
    code: 'B009',
    points: 250,
    frequency: '月1回',
    description: '他の医療機関への患者紹介',
    icon: '📋'
  },
  {
    type: '診療情報提供料(II)',
    label: '診療情報提供料(II)',
    code: 'B010',
    points: 500,
    frequency: '制限なし',
    description: 'セカンドオピニオンのための情報提供',
    icon: '🔍'
  },
  {
    type: '診療情報等連携共有料1',
    label: '診療情報等連携共有料1',
    code: 'B011-1',
    points: 120,
    frequency: '3月に1回',
    description: '医科機関・薬局への情報提供依頼',
    icon: '📤'
  },
  {
    type: '診療情報等連携共有料2',
    label: '診療情報等連携共有料2',
    code: 'B011-2',
    points: 120,
    frequency: '3月に1回',
    description: '医科機関からの依頼に応答',
    icon: '📥'
  }
]
