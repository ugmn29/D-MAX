// トレーニング機能用の型定義

export interface Training {
  id: string
  clinic_id: string | null
  training_name: string
  description: string | null
  category: string | null
  animation_storage_path: string | null
  mirror_display: boolean
  is_default: boolean
  default_action_seconds: number
  default_rest_seconds: number
  default_sets: number
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface TrainingMenu {
  id: string
  patient_id: string
  clinic_id: string
  menu_name: string | null
  prescribed_at: string
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface MenuTraining {
  id: string
  menu_id: string
  training_id: string
  sort_order: number
  action_seconds: number
  rest_seconds: number
  sets: number
  auto_progress: boolean
  created_at: string
}

export interface TrainingRecord {
  id: string
  patient_id: string
  clinic_id: string
  training_id: string
  menu_id: string
  performed_at: string
  completed: boolean
  interrupted: boolean
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night' | null
  actual_duration_seconds: number | null
  device_info: string | null
  created_at: string
}

export interface Template {
  id: string
  clinic_id: string
  template_name: string
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface TemplateTraining {
  id: string
  template_id: string
  training_id: string
  sort_order: number
  action_seconds: number
  rest_seconds: number
  sets: number
  auto_progress: boolean
  created_at: string
}

export interface OperationLog {
  id: string
  clinic_id: string
  operator_id: string | null
  action_type: string
  target_table: string
  target_record_id: string
  before_data: any
  after_data: any
  created_at: string
}

export interface DeviceAccount {
  id: string
  device_identifier: string
  patient_id: string
  last_login_at: string
  created_at: string
}

// 患者テーブルの拡張型
export interface PatientWithTraining {
  id: string
  clinic_id: string
  patient_number: number
  last_name: string
  first_name: string
  birth_date: string | null
  password_hash: string | null
  password_set: boolean
  training_last_login_at: string | null
  is_registered: boolean
}

// メニュー詳細（トレーニング情報を含む）
export interface TrainingMenuDetail extends TrainingMenu {
  menu_trainings: (MenuTraining & {
    training: Training
  })[]
}

// 統計データ型
export interface TrainingStats {
  totalPatients: number
  activePatients: number
  averageCompletionRate: number
  popularTrainings: {
    trainingId: string
    trainingName: string
    completionCount: number
  }[]
}

export interface PatientProgress {
  patientId: string
  patientName: string
  completionRate: number
  streak: number
  lastTrainingDate: string | null
  timeOfDayPreference: {
    morning: number
    afternoon: number
    evening: number
    night: number
  }
  weekdayPreference: {
    [key: number]: number // 0-6 (日-土)
  }
}

// カレンダー表示用
export interface CalendarData {
  date: string
  hasTraining: boolean
  completedCount: number
  totalCount: number
}

// ストリーク計算用
export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
}

// トレーニング実行状態
export interface TrainingSession {
  menuId: string
  currentTrainingIndex: number
  currentSet: number
  totalSets: number
  isResting: boolean
  remainingSeconds: number
  startedAt: string
}

// API レスポンス型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
