import { Training } from './training'

// 課題
export interface PatientIssue {
  id: string
  code: string
  name: string
  category: string | null
  description: string | null
  created_at: string
}

// 課題→トレーニング紐付け
export interface IssueTrainingMapping {
  id: string
  issue_code: string
  training_id: string
  priority: number
  description: string | null
  created_at: string
  training?: Training
}

// 患者の課題記録
export interface PatientIssueRecord {
  id: string
  patient_id: string
  clinic_id: string
  issue_code: string
  identified_at: string
  identified_by: string | null
  severity: 1 | 2 | 3 // 1:軽度, 2:中度, 3:重度
  notes: string | null
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
  issue?: PatientIssue
}

// 来院時評価
export interface TrainingEvaluation {
  id: string
  patient_id: string
  clinic_id: string
  menu_id: string | null
  training_id: string
  menu_training_id: string | null
  evaluated_at: string
  evaluator_id: string | null
  evaluation_level: 1 | 2 | 3
  comment: string | null
  created_at: string
  training?: Training
}

// 評価基準
export interface EvaluationCriteria {
  level_1_label: string
  level_1_criteria: string | null
  level_2_label: string
  level_2_criteria: string | null
  level_3_label: string
  level_3_criteria: string | null
}

// 評価→課題判定ルール
export interface EvaluationIssueRule {
  id: string
  training_id: string
  evaluation_level: 1 | 2 | 3
  identified_issue_code: string
  auto_identify: boolean
  description: string | null
  created_at: string
}

// 医院ごとの評価基準カスタマイズ
export interface ClinicTrainingCustomization {
  id: string
  clinic_id: string
  training_id: string
  evaluation_level_1_label: string | null
  evaluation_level_1_criteria: string | null
  evaluation_level_2_label: string | null
  evaluation_level_2_criteria: string | null
  evaluation_level_3_label: string | null
  evaluation_level_3_criteria: string | null
  created_at: string
  updated_at: string
}

// 評価入力用
export interface EvaluationInput {
  training_id: string
  menu_training_id: string | null
  evaluation_level: 1 | 2 | 3
  comment?: string
}

// 課題分析結果
export interface IdentifiedIssue {
  issue: PatientIssue
  triggering_evaluation: TrainingEvaluation
  recommended_trainings: IssueTrainingMapping[]
}

export interface IssueAnalysisResult {
  identified_issues: IdentifiedIssue[]
}

// 課題記録入力用
export interface IssueRecordInput {
  patient_id: string
  clinic_id: string
  issue_code: string
  severity: 1 | 2 | 3
  notes?: string
  identified_by?: string
}

// 進捗サマリー
export interface EvaluationProgressSummary {
  training_id: string
  training_name: string
  training_category: string
  latest_evaluation_level: number | null
  latest_evaluated_at: string | null
  evaluation_count: number
  level_3_count: number
  is_completed: boolean
}

// タイムライン用評価データ
export interface EvaluationTimeline {
  evaluated_at: string
  evaluations: TrainingEvaluation[]
}

// カレンダー用データ
export interface EvaluationCalendarData {
  date: string // YYYY-MM-DD
  evaluation_count: number
  evaluations: TrainingEvaluation[]
}

// トレーニング別進捗データ
export interface TrainingProgressData {
  training: Training
  evaluations: TrainingEvaluation[]
  latest_level: number | null
  is_completed: boolean
}
