/**
 * Web予約効果測定関連の型定義
 */

// 患者獲得経路
export interface PatientAcquisitionSource {
  id: string
  patient_id: string
  clinic_id: string

  // UTMパラメータ
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null

  // デバイス情報
  device_type: 'desktop' | 'mobile' | 'tablet' | null
  os: string | null
  browser: string | null

  // アンケート回答
  questionnaire_source: string | null
  questionnaire_detail: string | null

  // 最終判定
  final_source: string
  tracking_method: 'utm' | 'questionnaire'

  // メタデータ
  first_visit_at: string | null
  booking_completed_at: string | null
  created_at: string
}

// ファネルイベント
export interface WebBookingFunnelEvent {
  id: string
  session_id: string
  clinic_id: string

  // ファネルステップ
  step_name: string
  step_number: number

  // イベント情報
  event_type: 'page_view' | 'button_click' | 'form_submit'
  event_timestamp: string

  // UTMパラメータ
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null

  // デバイス情報
  device_type: 'desktop' | 'mobile' | 'tablet' | null

  // メタデータ
  metadata: Record<string, any> | null
  created_at: string
}

// 広告費記録
export interface AdSpendRecord {
  id: string
  clinic_id: string

  // 広告情報
  ad_platform: string
  campaign_name: string | null

  // 期間
  spend_date: string

  // 金額
  amount: number
  currency: string

  // メタデータ
  notes: string | null
  created_at: string
  updated_at: string
}

// 獲得経路統計
export interface AcquisitionSourceStats {
  source: string
  count: number
  utm_count: number
  questionnaire_count: number
  percentage: number
}

// デバイス統計
export interface DeviceStats {
  device: string
  count: number
  percentage: number
}

// ファネルステップデータ
export interface FunnelStepData {
  step_number: number
  step_name: string
  step_label: string
  session_count: number
  drop_off_count: number
  drop_off_rate: number
  conversion_rate: number
}

// 流入元別ファネルデータ
export interface FunnelBySource {
  source: string
  total_sessions: number
  completed_sessions: number
  completion_rate: number
  step_counts: {
    step: number
    count: number
    conversion_rate: number
  }[]
}

// LTV計算用データ
export interface PatientLTVData {
  patient_id: string
  acquisition_source: string
  total_revenue: number
  visit_count: number
  first_visit_date: string
  last_visit_date: string
  avg_revenue_per_visit: number
}

// ROI計算用データ
export interface ROIData {
  source: string
  ad_spend: number
  patient_count: number
  total_revenue: number
  roi: number // (revenue - spend) / spend * 100
  roas: number // revenue / spend
  cpa: number // cost per acquisition (spend / patient_count)
  avg_ltv: number
}
